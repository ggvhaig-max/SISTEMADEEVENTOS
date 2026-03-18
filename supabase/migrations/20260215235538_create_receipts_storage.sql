/*
  # Storage para Comprobantes de Pago
  
  1. Configuración
    - Crear bucket 'comprobantes' para almacenar comprobantes de pago de las compras
    - Configurar políticas públicas de lectura para que los administradores puedan verlos
    - Configurar políticas de escritura para usuarios no autenticados (clientes)
  
  2. Seguridad
    - Los comprobantes son públicamente accesibles para lectura
    - Cualquiera puede subir comprobantes (clientes anónimos)
    - Tamaño máximo de archivo: 10MB
    - Tipos permitidos: image/jpeg, image/png, image/webp, application/pdf
*/

-- Crear bucket para comprobantes de pago
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprobantes',
  'comprobantes',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir lectura pública de los comprobantes
CREATE POLICY "Public can view receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'comprobantes');

-- Política: Cualquiera puede subir comprobantes (clientes anónimos)
CREATE POLICY "Anyone can upload receipts"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'comprobantes');

-- Política: Admins autenticados pueden actualizar comprobantes
CREATE POLICY "Authenticated admins can update receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'comprobantes')
  WITH CHECK (bucket_id = 'comprobantes');

-- Política: Admins autenticados pueden eliminar comprobantes
CREATE POLICY "Authenticated admins can delete receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comprobantes');
