-- Migration: fase_1_b2b_schema
-- Descripción: Fase 1 del backend multi-tenant SaaS

-- 1. Tabla usuarios_plataforma
CREATE TABLE IF NOT EXISTS public.usuarios_plataforma (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol text NOT NULL CHECK (rol IN ('superadmin', 'vendedor', 'cliente')),
    nombre text NOT NULL,
    telefono text,
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabla tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES public.usuarios_plataforma(id) ON DELETE RESTRICT,
    nombre text NOT NULL,
    slug text UNIQUE NOT NULL,
    estado text DEFAULT 'prueba' CHECK (estado IN ('prueba', 'activo', 'vencido', 'suspendido', 'cancelado')),
    plan text DEFAULT 'basico',
    fecha_inicio timestamptz DEFAULT now(),
    fecha_vencimiento timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Tabla pagos_saas
CREATE TABLE IF NOT EXISTS public.pagos_saas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vendedor_id uuid REFERENCES public.usuarios_plataforma(id) ON DELETE SET NULL,
    registrado_por uuid NOT NULL REFERENCES public.usuarios_plataforma(id),
    aprobado_por uuid REFERENCES public.usuarios_plataforma(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('alta', 'renovacion')),
    plan text NOT NULL,
    monto_pagado numeric NOT NULL CHECK (monto_pagado >= 0),
    dias_a_activar integer NOT NULL CHECK (dias_a_activar > 0),
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    comprobante_url text,
    fecha_pago timestamptz DEFAULT now(),
    fecha_aprobacion timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Tabla comisiones_vendedores
CREATE TABLE IF NOT EXISTS public.comisiones_vendedores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id uuid NOT NULL REFERENCES public.usuarios_plataforma(id) ON DELETE CASCADE,
    pago_saas_id uuid NOT NULL REFERENCES public.pagos_saas(id) ON DELETE CASCADE,
    monto_comision numeric NOT NULL CHECK (monto_comision >= 0),
    estado text DEFAULT 'por_pagar' CHECK (estado IN ('por_pagar', 'pagado')),
    fecha_liquidacion timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Agregar tenant_id a tablas actuales
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Crear indices
CREATE INDEX IF NOT EXISTS idx_eventos_tenant ON public.eventos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compras_tenant ON public.compras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entradas_tenant ON public.entradas(tenant_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios_plataforma(rol);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_estado ON public.tenants(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_saas_tenant ON public.pagos_saas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_vendedor ON public.comisiones_vendedores(vendedor_id);

-- 6. Triggers updated_at
CREATE TRIGGER update_usuarios_plataforma_updated_at
    BEFORE UPDATE ON public.usuarios_plataforma
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_saas_updated_at
    BEFORE UPDATE ON public.pagos_saas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comisiones_vendedores_updated_at
    BEFORE UPDATE ON public.comisiones_vendedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS Base (Habilitar Seguridad a Nivel de Filas)
ALTER TABLE public.usuarios_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_saas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comisiones_vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas Base Iniciales
CREATE POLICY "RLS Basico usuarios_plataforma" 
    ON public.usuarios_plataforma FOR SELECT 
    USING (auth.uid() = id);

-- En Faker/Test environments, es útil permitir que la vista "public" o anónima acceda a la UI inicial
-- Pero RLS avanzados serán completados en Fase 2.
