-- Migration: fase_2_auth_rls_fix
-- Descripción: Corrección de políticas de seguridad en Fase 2, bloqueando lectura/escritura pública directa.

-- 1. Eliminar políticas SELECT y INSERT abiertas al público B2C.
DROP POLICY IF EXISTS "Tenants - Public Read" ON public.tenants;
DROP POLICY IF EXISTS "Eventos - Public Read" ON public.eventos;
DROP POLICY IF EXISTS "Compras - Insert Public" ON public.compras;
DROP POLICY IF EXISTS "Compras - Select Public" ON public.compras;
DROP POLICY IF EXISTS "Entradas - Select Public" ON public.entradas;

-- 2. Corregir el Trigger handle_new_user para forzar SIEMPRE rol 'cliente' en altas públicas
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
DECLARE base_slug text;
BEGIN
  -- Siempre generamos el slug para el caso que sea cliente (todos lo serán por defecto público)
  base_slug := coalesce(new.raw_user_meta_data->>'slug', split_part(new.email, '@', 1) || '-' || substr(md5(random()::text), 1, 4));

  -- Insertar perfil SIEMPRE como 'cliente', ignorando cualquier inyección desde metadata para saltar permisos.
  -- Solo roles creados por superadmin internamente tendrán otros privilegios.
  INSERT INTO public.usuarios_plataforma (id, rol, nombre, estado)
  VALUES (new.id, 'cliente', coalesce(new.raw_user_meta_data->>'nombre', 'Cliente SaaS'), 'activo');

  -- Siempre crearle tenant base en estado prueba de 14 días.
  INSERT INTO public.tenants (owner_id, nombre, slug, estado, plan, fecha_inicio, fecha_vencimiento)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'agencia', 'Agencia de ' || split_part(new.email, '@', 1)), base_slug, 'prueba', 'basico', now(), now() + interval '14 days');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
