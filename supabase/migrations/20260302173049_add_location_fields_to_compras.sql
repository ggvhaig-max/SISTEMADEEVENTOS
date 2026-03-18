/*
  # Add location fields to compras table

  1. Changes
    - Add `pais` column to `compras` table (text)
    - Add `ciudad` column to `compras` table (text)
  
  2. Notes
    - These fields store buyer's country and city information
    - Fields are optional (nullable) for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compras' AND column_name = 'pais'
  ) THEN
    ALTER TABLE compras ADD COLUMN pais text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compras' AND column_name = 'ciudad'
  ) THEN
    ALTER TABLE compras ADD COLUMN ciudad text;
  END IF;
END $$;