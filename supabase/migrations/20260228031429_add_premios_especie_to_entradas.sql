/*
  # Add Premios en Especie to Entradas (Números Bendecidos)

  1. Changes to `entradas` table
    - Add `premio_especie_activo` (boolean) - Indica si este número bendecido tiene premio en especie adicional
    - Add `premio_especie_descripcion` (text) - Descripción del premio en especie (ej: "Camiseta oficial", "Entrada VIP", "Bono de $50.000", etc.)
    - Add `premio_especie_imagen_url` (text) - URL de la imagen del premio en especie
  
  2. Purpose
    - Permite ofrecer premios adicionales en especie además de las entradas adicionales para números bendecidos
    - Los premios en especie aparecerán en la landing page junto a los números bendecidos
    - Es opcional: solo se muestra si premio_especie_activo = true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'premio_especie_activo'
  ) THEN
    ALTER TABLE entradas 
    ADD COLUMN premio_especie_activo boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'premio_especie_descripcion'
  ) THEN
    ALTER TABLE entradas 
    ADD COLUMN premio_especie_descripcion text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'premio_especie_imagen_url'
  ) THEN
    ALTER TABLE entradas 
    ADD COLUMN premio_especie_imagen_url text;
  END IF;
END $$;