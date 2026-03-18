/*
  # Add Payment Information and Customer Document Fields

  1. Changes to `eventos` table
    - Add bank account information fields for payment instructions
    - `banco_nombre` (text) - Bank name
    - `banco_tipo_cuenta` (text) - Account type (Ahorros/Corriente)
    - `banco_numero_cuenta` (text) - Account number
    - `banco_titular` (text) - Account holder name
    - `banco_documento` (text) - Account holder document
    - `banco_info_adicional` (text) - Additional payment info
    - `nequi_numero` (text) - Nequi phone number
    - `nequi_titular` (text) - Nequi account holder name
    
  2. Changes to `compras` table
    - Add `documento_numero` (text) - Customer document number for lookup
    - Add `documento_tipo` (text) - Document type (CC, CE, NIT, etc)
    
  3. Security
    - Keep existing RLS policies for compras
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_nombre'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_nombre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_tipo_cuenta'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_tipo_cuenta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_numero_cuenta'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_numero_cuenta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_titular'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_titular text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_documento'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_documento text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'banco_info_adicional'
  ) THEN
    ALTER TABLE eventos ADD COLUMN banco_info_adicional text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'nequi_numero'
  ) THEN
    ALTER TABLE eventos ADD COLUMN nequi_numero text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'nequi_titular'
  ) THEN
    ALTER TABLE eventos ADD COLUMN nequi_titular text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compras' AND column_name = 'documento_numero'
  ) THEN
    ALTER TABLE compras ADD COLUMN documento_numero text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compras' AND column_name = 'documento_tipo'
  ) THEN
    ALTER TABLE compras ADD COLUMN documento_tipo text DEFAULT 'CC';
  END IF;
END $$;