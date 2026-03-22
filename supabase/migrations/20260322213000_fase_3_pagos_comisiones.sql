-- Migration: fase_3_pagos_comisiones
-- Descripción: Funciones automáticas para orquestar los estados tras el pago SaaS.

-- 1. TRIGGER PARA APROBACIÓN DE PAGO SAAS
CREATE OR REPLACE FUNCTION public.handle_pago_aprobado()
RETURNS trigger AS $$
DECLARE
  v_tenant_estado text;
  v_fecha_vencimiento timestamptz;
  v_nueva_fecha timestamptz;
  v_porcentaje decimal;
BEGIN
  -- Verificar si está transitando recién a 'aprobado' (ya sea en UPDATE o INSERT)
  IF NEW.estado = 'aprobado' AND (TG_OP = 'INSERT' OR OLD.estado != 'aprobado') THEN
    
    -- 1. Obtener estado y fecha de vencimiento actual del tenant
    SELECT estado, fecha_vencimiento 
    INTO v_tenant_estado, v_fecha_vencimiento 
    FROM public.tenants 
    WHERE id = NEW.tenant_id;
    
    -- 2. Calcular la nueva fecha de vencimiento
    -- Si ya expiró o estaba inactivo, calculamos desde hoy. Si está activo, sumamos los días a su colchón existente.
    IF v_tenant_estado IN ('vencido', 'suspendido', 'cancelado') OR v_fecha_vencimiento IS NULL OR v_fecha_vencimiento < now() THEN
      v_nueva_fecha := now() + (NEW.dias_a_activar || ' days')::interval;
    ELSE
      v_nueva_fecha := v_fecha_vencimiento + (NEW.dias_a_activar || ' days')::interval;
    END IF;

    -- 3. Actualizar la licencia del Tenant
    UPDATE public.tenants
    SET 
      estado = 'activo',
      plan = NEW.plan,
      fecha_vencimiento = v_nueva_fecha,
      updated_at = now()
    WHERE id = NEW.tenant_id;

    -- 4. Registrar la Comisión automáticamente (Si el pago viene de un Vendedor Comercial)
    IF NEW.vendedor_id IS NOT NULL THEN
      -- Regla de Negocio: 30% por Alta nueva, 10% por Renovación/Upgrade
      IF NEW.tipo = 'alta' THEN
        v_porcentaje := 30.00;
      ELSE
        v_porcentaje := 10.00;
      END IF;

      INSERT INTO public.comisiones_vendedores (
        vendedor_id, 
        pago_saas_id, 
        monto_base, 
        porcentaje_aplicado, 
        monto_comision,
        estado
      ) VALUES (
        NEW.vendedor_id, 
        NEW.id, 
        NEW.monto_pagado, 
        v_porcentaje,
        (NEW.monto_pagado * (v_porcentaje / 100.0)),
        'pendiente'
      );
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar Trigger a la tabla de pagos_saas
DROP TRIGGER IF EXISTS on_pago_saas_aprobado ON public.pagos_saas;
CREATE TRIGGER on_pago_saas_aprobado
  AFTER INSERT OR UPDATE ON public.pagos_saas
  FOR EACH ROW EXECUTE PROCEDURE public.handle_pago_aprobado();
