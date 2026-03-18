/*
  # Agregar testimonios de Instagram a eventos

  1. Cambios
    - Agregar columna `testimonios_instagram` a la tabla `eventos`
      - Almacena un array de URLs de posts/reels de Instagram
      - Formato: ["https://www.instagram.com/p/ABC123/", "https://www.instagram.com/reel/XYZ789/"]
    
  2. Notas
    - Se usa JSONB para almacenar el array de URLs
    - Default es un array vacío
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'testimonios_instagram'
  ) THEN
    ALTER TABLE eventos ADD COLUMN testimonios_instagram JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;