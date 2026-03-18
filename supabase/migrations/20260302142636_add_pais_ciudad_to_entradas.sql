/*
  # Add País and Ciudad fields to entradas table

  1. Changes
    - Add `pais` column to `entradas` table for buyer's country
    - Add `ciudad` column to `entradas` table for buyer's city
    - Both fields are optional (nullable) for backwards compatibility
  
  2. Notes
    - These fields will be required in the purchase form going forward
    - Existing entries without these fields will remain valid
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'pais'
  ) THEN
    ALTER TABLE entradas ADD COLUMN pais text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas' AND column_name = 'ciudad'
  ) THEN
    ALTER TABLE entradas ADD COLUMN ciudad text;
  END IF;
END $$;