/*
  # Agregar URL de pago a paquetes

  1. Changes
    - Agregar columna url_pago a la tabla paquetes
    - Permite que cada paquete tenga su propio enlace de pago (PayPal u otros)
    
  2. Purpose
    - Cada paquete tendrá un URL de pago específico que se mostrará al comprador
    - El comprador verá el botón de pago correspondiente según el paquete seleccionado
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paquetes' AND column_name = 'url_pago'
  ) THEN
    ALTER TABLE paquetes ADD COLUMN url_pago text;
  END IF;
END $$;