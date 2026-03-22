-- Migration: fase_2_auth_rls
-- Descripción: Fase Backend 2 - Backfill de huérfanos, Triggers de registro y Políticas RLS estrictas B2B.

-- 1. ESTRATEGIA DE BACKFILL PARA REGISTROS HUÉRFANOS (tenant_id = NULL)
DO $$
DECLARE
  legacy_user_id uuid;
  legacy_tenant_id uuid;
BEGIN
  -- Verificar si existen eventos huérfanos
  IF EXISTS (SELECT 1 FROM public.eventos WHERE tenant_id IS NULL) THEN
    -- Rescatar el primer usuario administrador existente (si lo hay)
    SELECT id INTO legacy_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF legacy_user_id IS NOT NULL THEN
      -- Asegurarnos de que este usuario exista en usuarios_plataforma
      INSERT INTO public.usuarios_plataforma (id, rol, nombre, estado)
      VALUES (legacy_user_id, 'superadmin', 'Administrador Legacy', 'activo')
      ON CONFLICT (id) DO NOTHING;

      -- Crear un tenant "Legacy" para enjaular estos datos
      SELECT id INTO legacy_tenant_id FROM public.tenants WHERE slug = 'legacy';
      IF legacy_tenant_id IS NULL THEN
        INSERT INTO public.tenants (owner_id, nombre, slug, estado, plan, fecha_vencimiento)
        VALUES (legacy_user_id, 'Agencia Pionera', 'legacy', 'activo', 'ilimitado', now() + interval '10 years')
        RETURNING id INTO legacy_tenant_id;
      END IF;

      -- Enlazar todos los registros pre-existentes al tenant legacy
      UPDATE public.eventos SET tenant_id = legacy_tenant_id WHERE tenant_id IS NULL;
      UPDATE public.compras SET tenant_id = legacy_tenant_id WHERE tenant_id IS NULL;
      UPDATE public.entradas SET tenant_id = legacy_tenant_id WHERE tenant_id IS NULL;
      
      -- Paquetes y Premios también necesitan este trato si tuvieran FK (esto previene errores de FK)
      UPDATE public.paquetes SET tenant_id = legacy_tenant_id WHERE tenant_id IS NULL;
      UPDATE public.premios SET tenant_id = legacy_tenant_id WHERE tenant_id IS NULL;
    END IF;
  END IF;
END $$;

-- Limpiar anomalías irresolubles y blindar el esquema:
DELETE FROM public.eventos WHERE tenant_id IS NULL;
DELETE FROM public.compras WHERE tenant_id IS NULL;
DELETE FROM public.entradas WHERE tenant_id IS NULL;

ALTER TABLE public.eventos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.compras ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.entradas ALTER COLUMN tenant_id SET NOT NULL;


-- 2. LIMPIEZA DE ANTIGUAS POLÍTICAS INSEGURAS
DROP POLICY IF EXISTS "Admins can view all events" ON public.eventos;
DROP POLICY IF EXISTS "Admins can insert events" ON public.eventos;
DROP POLICY IF EXISTS "Admins can update events" ON public.eventos;
DROP POLICY IF EXISTS "Admins can delete events" ON public.eventos;

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.compras;
DROP POLICY IF EXISTS "Admins can insert purchases" ON public.compras;
DROP POLICY IF EXISTS "Admins can update purchases" ON public.compras;
DROP POLICY IF EXISTS "Admins can delete purchases" ON public.compras;

DROP POLICY IF EXISTS "Admins can view all entries" ON public.entradas;
DROP POLICY IF EXISTS "Admins can insert entries" ON public.entradas;
DROP POLICY IF EXISTS "Admins can update entries" ON public.entradas;
DROP POLICY IF EXISTS "Admins can delete entries" ON public.entradas;


-- 3. POLÍTICAS RLS B2B AISLADAS

-- TENANTS: Públicos_read (para landing), control absoluto de su Owner o Superadmin.
CREATE POLICY "Tenants - Public Read" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Tenants - Owner Access" ON public.tenants FOR ALL USING (
  owner_id = auth.uid() OR (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);

-- EVENTOS: Públicos_read (para la tienda), admin por Tenant Owner o Superadmin.
CREATE POLICY "Eventos - Public Read" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "Eventos - Tenant Admin" ON public.eventos FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  OR (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);

-- COMPRAS: Inserción pública (cualquiera puede comprar y pagar), Consulta pública (para buscar la boleta), Admin total del Tenant Owner o Superadmin
CREATE POLICY "Compras - Insert Public" ON public.compras FOR INSERT WITH CHECK (true);
CREATE POLICY "Compras - Select Public" ON public.compras FOR SELECT USING (true);
CREATE POLICY "Compras - Update/Delete Tenant Admin" ON public.compras FOR UPDATE USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  OR (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);
CREATE POLICY "Compras - Delete Tenant Admin" ON public.compras FOR DELETE USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  OR (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);

-- ENTRADAS: Igual que compras
CREATE POLICY "Entradas - Select Public" ON public.entradas FOR SELECT USING (true);
CREATE POLICY "Entradas - Tenant Admin" ON public.entradas FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  OR (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);

-- USUARIOS PLATAFORMA: Superadmin todo, los demas solo lectura individual (ya creado en Fase 1, se extiende aqui)
CREATE POLICY "Usuarios Plataforma - Superadmin All" ON public.usuarios_plataforma FOR ALL USING (
  (SELECT rol FROM public.usuarios_plataforma WHERE id = auth.uid()) = 'superadmin'
);


-- 4. TRIGGER PARA CREACIÓN AUTOMÁTICA DE CLIENTE (TENANT) TRAS SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_slug text;
BEGIN
  base_slug := coalesce(new.raw_user_meta_data->>'slug', split_part(new.email, '@', 1) || '-' || substr(md5(random()::text), 1, 4));

  -- Insertar perfil como 'cliente'
  INSERT INTO public.usuarios_plataforma (id, rol, nombre, estado)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'rol', 'cliente'), coalesce(new.raw_user_meta_data->>'nombre', 'Cliente SaaS'), 'activo');

  -- Si se registró como cliente, crearle un tenant en modo 'prueba' por defecto (14 días gratis)
  IF coalesce(new.raw_user_meta_data->>'rol', 'cliente') = 'cliente' THEN
    INSERT INTO public.tenants (owner_id, nombre, slug, estado, plan, fecha_inicio, fecha_vencimiento)
    VALUES (
      new.id, 
      coalesce(new.raw_user_meta_data->>'agencia', 'Agencia de ' || split_part(new.email, '@', 1)),
      base_slug,
      'prueba', 
      'basico', 
      now(), 
      now() + interval '14 days'
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger a auth.users (Drop preventivo si ya existía)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

