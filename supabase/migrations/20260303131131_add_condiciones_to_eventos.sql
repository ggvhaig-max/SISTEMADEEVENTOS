/*
  # Agregar campo de condiciones/instrucciones a eventos

  1. Cambios
    - Se agrega columna `condiciones` a la tabla `eventos`
    - Campo de texto largo para instrucciones y condiciones del evento
    - Valor por defecto: cadena vacía

  2. Notas
    - Este campo permitirá al admin agregar instrucciones personalizadas
    - Se mostrará en la landing page en lugar de "Personaliza Tu Compra"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'condiciones'
  ) THEN
    ALTER TABLE eventos ADD COLUMN condiciones text DEFAULT '';
  END IF;
END $$;