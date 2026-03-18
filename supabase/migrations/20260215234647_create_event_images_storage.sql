/*
  # Storage para Imágenes de Eventos
  
  1. Configuración
    - Crear bucket 'event-images' para almacenar imágenes de banner de eventos
    - Configurar políticas públicas de lectura
    - Configurar políticas de escritura solo para administradores autenticados
  
  2. Seguridad
    - Las imágenes son públicamente accesibles para lectura
    - Solo usuarios autenticados pueden subir/actualizar/eliminar imágenes
    - Tamaño máximo de archivo: 5MB
    - Tipos permitidos: image/jpeg, image/png, image/webp
*/

-- Crear bucket para imágenes de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir lectura pública de las imágenes
CREATE POLICY "Public can view event images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-images');

-- Política: Solo admins autenticados pueden subir imágenes
CREATE POLICY "Authenticated admins can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-images');

-- Política: Solo admins autenticados pueden actualizar imágenes
CREATE POLICY "Authenticated admins can update event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-images')
  WITH CHECK (bucket_id = 'event-images');

-- Política: Solo admins autenticados pueden eliminar imágenes
CREATE POLICY "Authenticated admins can delete event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images');
