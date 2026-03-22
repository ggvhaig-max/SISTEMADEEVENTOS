-- Migration: fase_4_bloqueos_vencimientos
-- Descripción: Limpia el permiso de mutación para inquilinos inactivos y prepara la función PL/pgSQL para orquestar la desactivación vía CRON.

-- 1. Helper Function
CREATE OR REPLACE FUNCTION public.is_tenant_activo(t_id uuid) RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenants 
    WHERE id = t_id AND estado IN ('activo', 'prueba')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Función de Expiración Masiva
CREATE OR REPLACE FUNCTION public.check_expirations() RETURNS void AS $$
BEGIN
  -- Relegar a estado 'vencido' a todos aquellos que tengan fecha en el pasado
  UPDATE public.tenants 
  SET estado = 'vencido', updated_at = now() 
  WHERE estado IN ('activo', 'prueba') AND fecha_vencimiento < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. RESTRICCIONES RLS: PROTECCIÓN ACTIVA
-- ==========================================

-- A. EVENTOS
DROP POLICY IF EXISTS "Eventos - Tenant Admin" ON public.eventos;

CREATE POLICY "Eventos - Tenant Select" ON public.eventos FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
);
CREATE POLICY "Eventos - Tenant Insert" ON public.eventos FOR INSERT WITH CHECK (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);
CREATE POLICY "Eventos - Tenant Update" ON public.eventos FOR UPDATE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);
CREATE POLICY "Eventos - Tenant Delete" ON public.eventos FOR DELETE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);

-- B. COMPRAS
DROP POLICY IF EXISTS "Compras - Update/Delete Tenant Admin" ON public.compras;
DROP POLICY IF EXISTS "Compras - Delete Tenant Admin" ON public.compras;

CREATE POLICY "Compras - Tenant Select" ON public.compras FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
);
CREATE POLICY "Compras - Tenant Update" ON public.compras FOR UPDATE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);
CREATE POLICY "Compras - Tenant Delete" ON public.compras FOR DELETE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);

-- C. ENTRADAS
DROP POLICY IF EXISTS "Entradas - Tenant Admin" ON public.entradas;

CREATE POLICY "Entradas - Tenant Select" ON public.entradas FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
);
CREATE POLICY "Entradas - Tenant Update" ON public.entradas FOR UPDATE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);
CREATE POLICY "Entradas - Tenant Delete" ON public.entradas FOR DELETE USING (
  (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin'))
  AND public.is_tenant_activo(tenant_id)
);

-- D. TENANTS: Evitar que modifiquen su propio dueño salvo Superadmin
DROP POLICY IF EXISTS "Tenants - Superadmin Select" ON public.tenants;
CREATE POLICY "Tenants - Superadmin Select" ON public.tenants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
);
