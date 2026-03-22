-- Migration: fase_3_fix_comisiones
-- Descripción: Agrega los campos de detalle a la tabla comisiones_vendedores que faltaban desde la fase 1 e iguala el estado del trigger a la restricción check original 'por_pagar'.

ALTER TABLE public.comisiones_vendedores
ADD COLUMN IF NOT EXISTS monto_base numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_aplicado numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.handle_pago_aprobado()
RETURNS trigger AS $$
DECLARE
  v_tenant_estado text;
  v_fecha_vencimiento timestamptz;
  v_nueva_fecha timestamptz;
  v_porcentaje decimal;
BEGIN
  IF NEW.estado = 'aprobado' AND (TG_OP = 'INSERT' OR OLD.estado != 'aprobado') THEN
    
    SELECT estado, fecha_vencimiento 
    INTO v_tenant_estado, v_fecha_vencimiento 
    FROM public.tenants 
    WHERE id = NEW.tenant_id;
    
    IF v_tenant_estado IN ('vencido', 'suspendido', 'cancelado', 'prueba') OR v_fecha_vencimiento IS NULL OR v_fecha_vencimiento < now() THEN
      v_nueva_fecha := now() + (NEW.dias_a_activar || ' days')::interval;
    ELSE
      v_nueva_fecha := v_fecha_vencimiento + (NEW.dias_a_activar || ' days')::interval;
    END IF;

    UPDATE public.tenants
    SET 
      estado = 'activo',
      plan = NEW.plan,
      fecha_vencimiento = v_nueva_fecha,
      updated_at = now()
    WHERE id = NEW.tenant_id;

    IF NEW.vendedor_id IS NOT NULL THEN
      IF NEW.tipo = 'alta' THEN
        SELECT comision_porcentaje_alta INTO v_porcentaje 
        FROM public.usuarios_plataforma WHERE id = NEW.vendedor_id;
      ELSE
        SELECT comision_porcentaje_renovacion INTO v_porcentaje 
        FROM public.usuarios_plataforma WHERE id = NEW.vendedor_id;
      END IF;

      v_porcentaje := coalesce(v_porcentaje, 0);

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
        'por_pagar'  -- Corregido: la fase 1 dicta por_pagar o pagado.
      );
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
