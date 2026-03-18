/*
  # Crear storage para videos de testimonios

  1. Nuevo Bucket
    - `testimonials-videos` - Almacena videos de testimonios
    - Acceso público para lectura
    - Tamaño máximo: 50MB por archivo
    - Tipos permitidos: video/mp4, video/webm, video/quicktime

  2. Políticas
    - Permitir lectura pública de videos
    - Solo usuarios autenticados pueden subir/eliminar
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonials-videos',
  'testimonials-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view testimonials videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'testimonials-videos');

CREATE POLICY "Authenticated users can upload testimonials videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials-videos');

CREATE POLICY "Authenticated users can update testimonials videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonials-videos');

CREATE POLICY "Authenticated users can delete testimonials videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials-videos');