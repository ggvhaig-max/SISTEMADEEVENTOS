-- ==========================================
-- FASE 6: SOPORTE Y AUDITORÍA
-- ==========================================

-- 1. TABLA: tickets_soporte
CREATE TABLE public.tickets_soporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    creado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    asunto TEXT NOT NULL,
    prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')) DEFAULT 'media',
    estado TEXT NOT NULL CHECK (estado IN ('abierto', 'en_proceso', 'resuelto', 'cerrado')) DEFAULT 'abierto',
    ultimo_mensaje_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cerrado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_tickets_soporte_tenant ON public.tickets_soporte(tenant_id);
CREATE INDEX idx_tickets_soporte_estado ON public.tickets_soporte(estado);

-- 2. TABLA: mensajes_ticket
CREATE TABLE public.mensajes_ticket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets_soporte(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    mensaje TEXT NOT NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_mensajes_ticket_ticket ON public.mensajes_ticket(ticket_id);

-- Trigger para actualizar `ultimo_mensaje_at` del ticket cuando hay un nuevo mensaje
CREATE OR REPLACE FUNCTION update_ticket_ultimo_mensaje() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tickets_soporte
    SET ultimo_mensaje_at = NEW.created_at,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_ticket_ultimo_mensaje
AFTER INSERT ON public.mensajes_ticket
FOR EACH ROW EXECUTE FUNCTION update_ticket_ultimo_mensaje();


-- 3. TABLA: auditoria_acciones
CREATE TABLE public.auditoria_acciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable (ej: cron)
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL, -- Para asociar el log al tenant fácilmente
    accion TEXT NOT NULL,
    entidad_tipo TEXT NOT NULL,
    entidad_id UUID,
    detalles JSONB,
    origen TEXT NOT NULL CHECK (origen IN ('backend', 'frontend', 'cron', 'trigger')),
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_auditoria_entidad ON public.auditoria_acciones(entidad_tipo, entidad_id);
CREATE INDEX idx_auditoria_usuario ON public.auditoria_acciones(usuario_id);
CREATE INDEX idx_auditoria_tenant ON public.auditoria_acciones(tenant_id);
CREATE INDEX idx_auditoria_created_at ON public.auditoria_acciones(created_at);

-- ==========================================
-- ACTUALIZACIÓN AUTOMÁTICA DE UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_soporte_modtime
BEFORE UPDATE ON public.tickets_soporte
FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- ==========================================
-- TRIGGERS DE AUDITORÍA AUTOMÁTICOS (BACKEND)
-- ==========================================

-- A: Auditoría de Pagos SaaS
CREATE OR REPLACE FUNCTION audit_pagos_saas() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO public.auditoria_acciones(usuario_id, tenant_id, accion, entidad_tipo, entidad_id, detalles, origen)
        VALUES (
            auth.uid(),
            NEW.tenant_id,
            'PAGO_' || UPPER(NEW.estado),
            'pagos_saas',
            NEW.id,
            jsonb_build_object('estado_anterior', OLD.estado, 'nuevo_estado', NEW.estado, 'monto', NEW.monto_pagado, 'plan', NEW.plan),
            'trigger'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_audit_pagos_saas
AFTER UPDATE ON public.pagos_saas
FOR EACH ROW EXECUTE FUNCTION audit_pagos_saas();

-- B: Auditoría de Tenants (Estado y Fecha Vencimiento)
CREATE OR REPLACE FUNCTION audit_tenants() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO public.auditoria_acciones(usuario_id, tenant_id, accion, entidad_tipo, entidad_id, detalles, origen)
        VALUES (
            auth.uid(),
            NEW.id,
            'TENANT_ESTADO_MODIFICADO',
            'tenants',
            NEW.id,
            jsonb_build_object('estado_anterior', OLD.estado, 'nuevo_estado', NEW.estado),
            'trigger'
        );
    END IF;

    IF OLD.fecha_vencimiento IS DISTINCT FROM NEW.fecha_vencimiento THEN
        INSERT INTO public.auditoria_acciones(usuario_id, tenant_id, accion, entidad_tipo, entidad_id, detalles, origen)
        VALUES (
            auth.uid(),
            NEW.id,
            'TENANT_VENCIMIENTO_MODIFICADO',
            'tenants',
            NEW.id,
            jsonb_build_object('fecha_anterior', OLD.fecha_vencimiento, 'nueva_fecha', NEW.fecha_vencimiento),
            'trigger'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_audit_tenants
AFTER UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION audit_tenants();

-- C: Auditoría de Comisiones Vendedores
CREATE OR REPLACE FUNCTION audit_comisiones() RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        -- Obtener el tenant_id del pago asociado a la comisión para mantener trazabilidad
        SELECT tenant_id INTO v_tenant_id FROM public.pagos_saas WHERE id = NEW.pago_id;

        INSERT INTO public.auditoria_acciones(usuario_id, tenant_id, accion, entidad_tipo, entidad_id, detalles, origen)
        VALUES (
            auth.uid(),
            v_tenant_id,
            'COMISION_' || UPPER(NEW.estado),
            'comisiones_vendedores',
            NEW.id,
            jsonb_build_object('estado_anterior', OLD.estado, 'nuevo_estado', NEW.estado, 'monto', NEW.monto_comision),
            'trigger'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_audit_comisiones
AFTER UPDATE ON public.comisiones_vendedores
FOR EACH ROW EXECUTE FUNCTION audit_comisiones();


-- ==========================================
-- POLÍTICAS DE RLS
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_plataforma 
        WHERE id = user_id AND rol = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_acciones ENABLE ROW LEVEL SECURITY;

-- Evitar borrado físico de tickets/mensajes/auditoria
CREATE POLICY "prohibir_delete_tickets" ON public.tickets_soporte FOR DELETE TO authenticated USING (false);
CREATE POLICY "prohibir_delete_mensajes" ON public.mensajes_ticket FOR DELETE TO authenticated USING (false);
CREATE POLICY "prohibir_delete_auditoria" ON public.auditoria_acciones FOR DELETE TO authenticated USING (false);

-- Tickets RLS:
-- 1. Insertar ticket: Solo clientes dueños del tenant
CREATE POLICY "tenant_owner_insert_tickets" ON public.tickets_soporte FOR INSERT TO authenticated
WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- 2. Leer/Actualizar ticket: Dueño del tenant
CREATE POLICY "tenant_owner_select_tickets" ON public.tickets_soporte FOR SELECT TO authenticated
USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_owner_update_tickets" ON public.tickets_soporte FOR UPDATE TO authenticated
USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- 3. Superadmin puede leer y actualizar todos
CREATE POLICY "superadmin_all_tickets_select" ON public.tickets_soporte FOR SELECT TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "superadmin_all_tickets_update" ON public.tickets_soporte FOR UPDATE TO authenticated
USING (public.is_superadmin(auth.uid()));


-- Mensajes RLS:
-- 1. Insertar: Superadmin o Dueño
CREATE POLICY "insert_mensajes_permitido" ON public.mensajes_ticket FOR INSERT TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid()) OR 
    ticket_id IN (SELECT id FROM public.tickets_soporte WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
);

-- 2. Leer: Superadmin o Dueño
CREATE POLICY "select_mensajes_permitido" ON public.mensajes_ticket FOR SELECT TO authenticated
USING (
    public.is_superadmin(auth.uid()) OR 
    ticket_id IN (SELECT id FROM public.tickets_soporte WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
);

-- Auditoría RLS:
-- 1. Leer: Solo Superadmin
CREATE POLICY "superadmin_lee_auditoria" ON public.auditoria_acciones FOR SELECT TO authenticated
USING (public.is_superadmin(auth.uid()));

-- 2. Insertar (Modo Excepción desde Frontend):
-- ESTRICTO: Solo permite bypass insertar al Frontend si eres superadmin y la acción es específicamente BYPASS_SOPORTE_ACTIVADO
CREATE POLICY "frontend_escribe_solo_excepciones" ON public.auditoria_acciones FOR INSERT TO authenticated
WITH CHECK (
    public.is_superadmin(auth.uid()) AND
    origen = 'frontend' AND
    accion = 'BYPASS_SOPORTE_ACTIVADO'
);
