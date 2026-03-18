/*
  # Agregar campo de premio a entradas bendecidas
  
  1. Cambios
    - Agregar columna `premio_valor` a la tabla `entradas` para almacenar el valor del premio cuando una entrada es bendecida
    - Este campo almacena el monto en dinero que se gana al obtener ese número
  
  2. Notas
    - Solo las entradas con `es_bendecida = true` tendrán un valor en este campo
    - Cuando un cliente obtiene un número bendecido, gana automáticamente el premio_valor
*/

-- Agregar campo premio_valor a la tabla entradas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'premio_valor'
  ) THEN
    ALTER TABLE entradas ADD COLUMN premio_valor DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;
