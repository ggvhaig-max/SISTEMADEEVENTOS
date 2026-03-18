/*
  # Add WhatsApp and Marquee News to Events

  1. Changes
    - Add `mensaje_whatsapp` (text) - Message inviting users to WhatsApp group
    - Add `link_whatsapp` (text) - WhatsApp group invitation link
    - Add `noticias_marquee` (text) - Scrolling news messages displayed above event image
    
  2. Notes
    - These fields allow admins to customize social engagement features
    - All fields are optional (nullable)
    - noticias_marquee can contain multiple messages separated by |
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'mensaje_whatsapp'
  ) THEN
    ALTER TABLE eventos ADD COLUMN mensaje_whatsapp text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'link_whatsapp'
  ) THEN
    ALTER TABLE eventos ADD COLUMN link_whatsapp text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'noticias_marquee'
  ) THEN
    ALTER TABLE eventos ADD COLUMN noticias_marquee text;
  END IF;
END $$;