-- Migration: fase_3_saas_rls
-- Descripción: RLS para pagos_saas y comisiones_vendedores basado en el esquema B2B

-- 1. Políticas para pagos_saas
DROP POLICY IF EXISTS "Superadmin Pagos All" ON public.pagos_saas;
CREATE POLICY "Superadmin Pagos All" ON public.pagos_saas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
  );

DROP POLICY IF EXISTS "Vendedor Pagos Select" ON public.pagos_saas;
CREATE POLICY "Vendedor Pagos Select" ON public.pagos_saas
  FOR SELECT
  USING (
    registrado_por = auth.uid() OR vendedor_id = auth.uid()
  );

DROP POLICY IF EXISTS "Vendedor Pagos Insert" ON public.pagos_saas;
CREATE POLICY "Vendedor Pagos Insert" ON public.pagos_saas
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'vendedor')
    AND registrado_por = auth.uid()
  );

DROP POLICY IF EXISTS "Cliente Pagos Select" ON public.pagos_saas;
CREATE POLICY "Cliente Pagos Select" ON public.pagos_saas
  FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- 2. Políticas para comisiones_vendedores
DROP POLICY IF EXISTS "Superadmin Comisiones All" ON public.comisiones_vendedores;
CREATE POLICY "Superadmin Comisiones All" ON public.comisiones_vendedores
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'superadmin')
  );

DROP POLICY IF EXISTS "Vendedor Comisiones Select" ON public.comisiones_vendedores;
CREATE POLICY "Vendedor Comisiones Select" ON public.comisiones_vendedores
  FOR SELECT
  USING (vendedor_id = auth.uid());
