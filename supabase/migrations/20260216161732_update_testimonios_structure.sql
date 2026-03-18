/*
  # Actualizar estructura de testimonios

  1. Cambios
    - Cambiar `testimonios_instagram` por `testimonios`
    - Nuevo formato: array de objetos con tipo ('instagram' o 'video') y url
    - Ejemplo: [{"type": "instagram", "url": "https://instagram.com/p/..."}, {"type": "video", "url": "https://..."}]

  2. Notas
    - Migra datos existentes al nuevo formato
    - Mantiene compatibilidad con URLs de Instagram existentes
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'testimonios_instagram'
  ) THEN
    ALTER TABLE eventos RENAME COLUMN testimonios_instagram TO testimonios;
    
    UPDATE eventos
    SET testimonios = (
      SELECT jsonb_agg(
        jsonb_build_object('type', 'instagram', 'url', value::text)
      )
      FROM jsonb_array_elements_text(testimonios)
    )
    WHERE testimonios IS NOT NULL AND jsonb_typeof(testimonios) = 'array';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'testimonios'
  ) THEN
    ALTER TABLE eventos ADD COLUMN testimonios JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;