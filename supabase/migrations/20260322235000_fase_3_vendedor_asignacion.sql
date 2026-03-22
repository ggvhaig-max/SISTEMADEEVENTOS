-- Migration: fase_3_vendedor_asignacion
-- Descripción: Enlaza Tenants a Vendedores específicos para restringir RLS y evitar que un vendedor registre pagos a un cliente que no le pertenece.

-- 1. Agregamos el enlace vendedor -> tenant
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES public.usuarios_plataforma(id);

-- 2. Restringir visibilidad de Tenants para el Vendedor (Solo ve a SUS clientes)
DROP POLICY IF EXISTS "Vendedor Tenants Select" ON public.tenants;
CREATE POLICY "Vendedor Tenants Select" ON public.tenants
  FOR SELECT
  USING (vendedor_id = auth.uid());

-- 3. Blindar inserción de Pagos: El vendedor SOLO puede ingresar pagos si él es el responsable del tenant y se marca a sí mismo
DROP POLICY IF EXISTS "Vendedor Pagos Insert" ON public.pagos_saas;
CREATE POLICY "Vendedor Pagos Insert" ON public.pagos_saas
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_plataforma WHERE id = auth.uid() AND rol = 'vendedor')
    AND registrado_por = auth.uid()
    AND vendedor_id = auth.uid()
    AND tenant_id IN (SELECT id FROM public.tenants WHERE vendedor_id = auth.uid())
  );
