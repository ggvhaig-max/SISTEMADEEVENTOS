/*
  # Agregar configuración de pago a eventos
  
  1. Cambios
    - Agregar campos de configuración de pago a la tabla `eventos`
    - Soporte para transferencia bancaria y/o pasarela de pago
    
  2. Campos nuevos
    - `metodo_pago` (text): 'transferencia', 'pasarela', o 'ambos'
    - `banco` (text): Nombre del banco para transferencias
    - `tipo_cuenta` (text): Tipo de cuenta (Ahorros/Corriente)
    - `numero_cuenta` (text): Número de cuenta bancaria
    - `titular_cuenta` (text): Nombre del titular de la cuenta
    - `identificacion_titular` (text): Documento de identidad del titular
    - `url_pasarela` (text): URL de la pasarela de pago
    - `instrucciones_pago` (text): Instrucciones adicionales para el pago
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'metodo_pago'
  ) THEN
    ALTER TABLE eventos ADD COLUMN metodo_pago text DEFAULT 'transferencia';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'tipo_cuenta'
  ) THEN
    ALTER TABLE eventos ADD COLUMN tipo_cuenta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'numero_cuenta'
  ) THEN
    ALTER TABLE eventos ADD COLUMN numero_cuenta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'titular_cuenta'
  ) THEN
    ALTER TABLE eventos ADD COLUMN titular_cuenta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'identificacion_titular'
  ) THEN
    ALTER TABLE eventos ADD COLUMN identificacion_titular text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'url_pasarela'
  ) THEN
    ALTER TABLE eventos ADD COLUMN url_pasarela text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'instrucciones_pago'
  ) THEN
    ALTER TABLE eventos ADD COLUMN instrucciones_pago text;
  END IF;
END $$;