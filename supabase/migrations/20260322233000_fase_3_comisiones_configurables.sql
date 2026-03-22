-- Migration: fase_3_comisiones_configurables
-- Descripción: Convierte los porcentajes de comisión de valores quemados (hardcoded) a variables configurables por cada vendedor en su perfil.

-- 1. Agregar columnas al perfil de usuarios_plataforma para controlar tarifas personalizadas
ALTER TABLE public.usuarios_plataforma
ADD COLUMN IF NOT EXISTS comision_porcentaje_alta numeric DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS comision_porcentaje_renovacion numeric DEFAULT 10.00;

-- 2. Reemplazar el trigger para que absorba los porcentajes administrables
CREATE OR REPLACE FUNCTION public.handle_pago_aprobado()
RETURNS trigger AS $$
DECLARE
  v_tenant_estado text;
  v_fecha_vencimiento timestamptz;
  v_nueva_fecha timestamptz;
  v_porcentaje decimal;
BEGIN
  -- Verificar transición a 'aprobado' sin repetir (Evita doble comisión / doble aprobación)
  IF NEW.estado = 'aprobado' AND (TG_OP = 'INSERT' OR OLD.estado != 'aprobado') THEN
    
    -- 1. Obtener estado y fecha del tenant
    SELECT estado, fecha_vencimiento 
    INTO v_tenant_estado, v_fecha_vencimiento 
    FROM public.tenants 
    WHERE id = NEW.tenant_id;
    
    -- 2. Lógica de acumulación de días
    -- Si está vencido o no tiene fecha válida, arranca a contar desde HOY.
    -- Si sigue activo (pago adelantado), se SUMAN los días a su colchón existente.
    IF v_tenant_estado IN ('vencido', 'suspendido', 'cancelado', 'prueba') OR v_fecha_vencimiento IS NULL OR v_fecha_vencimiento < now() THEN
      v_nueva_fecha := now() + (NEW.dias_a_activar || ' days')::interval;
    ELSE
      v_nueva_fecha := v_fecha_vencimiento + (NEW.dias_a_activar || ' days')::interval;
    END IF;

    -- 3. Insertar la nueva licencia al Tenant
    UPDATE public.tenants
    SET 
      estado = 'activo',
      plan = NEW.plan,
      fecha_vencimiento = v_nueva_fecha,
      updated_at = now()
    WHERE id = NEW.tenant_id;

    -- 4. Cálculo dinámico de comisión
    IF NEW.vendedor_id IS NOT NULL THEN
      
      -- Buscar cuánto se le debe pagar a ESTE vendedor específicamente
      IF NEW.tipo = 'alta' THEN
        SELECT comision_porcentaje_alta INTO v_porcentaje 
        FROM public.usuarios_plataforma WHERE id = NEW.vendedor_id;
      ELSE
        SELECT comision_porcentaje_renovacion INTO v_porcentaje 
        FROM public.usuarios_plataforma WHERE id = NEW.vendedor_id;
      END IF;

      -- Fallback preventivo (si alguien lo borró manualmente)
      v_porcentaje := coalesce(v_porcentaje, 0);

      -- Creación del pago pendiente para el vendedor
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
  
  -- Recordar: Si es 'rechazado' u otro, el IF pasa de largo, no hay comisión, ni licencia actualizada.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
