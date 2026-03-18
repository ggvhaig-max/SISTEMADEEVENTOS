/*
  # Add Buyer Information to Entradas Table

  1. Changes
    - Add `nombre_comprador` column to store the buyer's name
    - Add `telefono` column to store the buyer's phone number
    - Add `documento` column to store the buyer's document number
  
  2. Purpose
    - Enable displaying winner names on blessed numbers
    - Store complete buyer contact information for each entry
    - Improve traceability and customer service
*/

DO $$
BEGIN
  -- Add nombre_comprador column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'nombre_comprador'
  ) THEN
    ALTER TABLE entradas ADD COLUMN nombre_comprador text;
  END IF;

  -- Add telefono column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE entradas ADD COLUMN telefono text;
  END IF;

  -- Add documento column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'documento'
  ) THEN
    ALTER TABLE entradas ADD COLUMN documento text;
  END IF;
END $$;