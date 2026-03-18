/*
  # Add Telegram Support to Events

  1. Changes
    - Add `telegram_mensaje` column to `eventos` table for Telegram group invitation message
    - Add `telegram_link` column to `eventos` table for Telegram group URL
    - Both fields are optional (nullable)
    - If both fields are filled, the Telegram section will be visible in the public event view
  
  2. Notes
    - Keeps existing WhatsApp functionality intact
    - Telegram is an alternative to WhatsApp, not a replacement
    - The public view will show Telegram section only if both message and link are provided
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'telegram_mensaje'
  ) THEN
    ALTER TABLE eventos ADD COLUMN telegram_mensaje text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'telegram_link'
  ) THEN
    ALTER TABLE eventos ADD COLUMN telegram_link text;
  END IF;
END $$;