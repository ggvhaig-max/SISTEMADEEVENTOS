/*
  # Sistema de Eventos con Entradas por Lote - Base de Datos Completa

  ## Descripción General
  Sistema completo para gestión de eventos masivos con asignación aleatoria de entradas,
  optimizado para manejar hasta 99,999 entradas por evento.

  ## 1. Nuevas Tablas

  ### `eventos`
  Tabla principal que almacena la información de cada evento creado por el administrador.
  - `id` (uuid, PK): Identificador único del evento
  - `nombre` (text): Nombre del evento
  - `slug` (text, unique): URL amigable generada automáticamente
  - `imagen_url` (text): URL de la imagen principal del evento
  - `descripcion` (text): Descripción del evento
  - `fecha_cierre` (timestamptz): Fecha límite para comprar entradas
  - `fecha_sorteo` (timestamptz): Fecha del sorteo
  - `loteria_referencia` (text): Lotería de referencia para el sorteo
  - `total_entradas` (integer): Cantidad total de entradas (10000, 50000, 99999)
  - `precio_por_entrada` (numeric): Precio individual por entrada
  - `activo` (boolean): Si el evento está activo para compras
  - `estado` (text): Estado del evento (activo, cerrado, finalizado)
  - `video_url` (text, nullable): URL del video del evento/sorteo
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Última actualización

  ### `paquetes`
  Define los paquetes de entradas que se pueden comprar en cada evento.
  - `id` (uuid, PK): Identificador único del paquete
  - `evento_id` (uuid, FK): Referencia al evento
  - `cantidad_entradas` (integer): Cantidad de entradas en el paquete
  - `precio_total` (numeric): Precio total del paquete
  - `es_mas_popular` (boolean): Marca si es el paquete destacado
  - `activo` (boolean): Si el paquete está disponible para compra
  - `orden` (integer): Orden de visualización
  - `created_at` (timestamptz): Fecha de creación

  ### `entradas`
  Almacena todas las entradas de todos los eventos (optimizada para 99,999 por evento).
  - `id` (uuid, PK): Identificador único de la entrada
  - `evento_id` (uuid, FK): Referencia al evento
  - `numero_entrada` (integer): Número de la entrada (1-99999)
  - `estado` (text): Estado (disponible, reservada, pagada, premiada)
  - `correo_comprador` (text, nullable): Email del comprador
  - `compra_id` (uuid, FK nullable): Referencia a la compra
  - `es_bendecida` (boolean): Si es una entrada con premio interno
  - `premio_id` (uuid, FK nullable): Referencia al premio si es bendecida
  - `bloqueada` (boolean): Si está bloqueada y no puede asignarse aún
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Última actualización

  ### `compras`
  Registra todas las compras realizadas por los usuarios.
  - `id` (uuid, PK): Identificador único de la compra
  - `evento_id` (uuid, FK): Referencia al evento
  - `correo_comprador` (text): Email del comprador
  - `nombre_comprador` (text): Nombre completo del comprador
  - `telefono` (text): Teléfono de contacto
  - `cantidad_entradas` (integer): Cantidad de entradas compradas
  - `monto_total` (numeric): Monto total pagado
  - `estado` (text): Estado (pendiente, aprobada, rechazada)
  - `comprobante_url` (text, nullable): URL del comprobante de pago
  - `metodo_pago` (text): Método de pago (transferencia, nequi)
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Última actualización

  ### `premios`
  Define los premios principales e internos de cada evento.
  - `id` (uuid, PK): Identificador único del premio
  - `evento_id` (uuid, FK): Referencia al evento
  - `tipo` (text): Tipo de premio (principal, interno)
  - `titulo` (text): Título del premio
  - `descripcion` (text): Descripción del premio
  - `imagen_url` (text, nullable): URL de la imagen del premio
  - `valor` (numeric): Valor monetario del premio
  - `numero_ganador` (integer, nullable): Número ganador (para premio principal)
  - `entrada_id` (uuid, FK nullable): Entrada ganadora
  - `publicado` (boolean): Si el ganador ya fue publicado
  - `created_at` (timestamptz): Fecha de creación

  ### `premios_bendecidos_config`
  Configuración de activación de entradas bendecidas.
  - `id` (uuid, PK): Identificador único
  - `evento_id` (uuid, FK): Referencia al evento
  - `entrada_id` (uuid, FK): Referencia a la entrada bendecida
  - `premio_id` (uuid, FK): Referencia al premio asociado
  - `activacion_tipo` (text): Tipo (manual, porcentaje, inmediata)
  - `activacion_porcentaje` (integer, nullable): % de ventas para activar
  - `activada` (boolean): Si ya fue activada
  - `activada_en` (timestamptz, nullable): Cuándo fue activada
  - `created_at` (timestamptz): Fecha de creación

  ## 2. Índices
  Se crean índices en columnas frecuentemente consultadas para optimizar rendimiento:
  - evento_id en todas las tablas relacionales
  - correo_comprador en entradas y compras
  - estado en entradas y compras
  - slug en eventos (único)
  - numero_entrada + evento_id en entradas (único compuesto)

  ## 3. Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por defecto
  - Solo usuarios autenticados (admins) pueden acceder a datos sensibles
  - Las landings públicas usarán Edge Functions para exponer solo datos necesarios

  ## 4. Notas Importantes
  - Sistema optimizado para hasta 99,999 entradas por evento
  - Asignación aleatoria se manejará mediante queries SQL optimizadas
  - Las entradas se generan al crear el evento
  - El sistema permite múltiples eventos simultáneos
*/

-- Crear tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text UNIQUE NOT NULL,
  imagen_url text,
  descripcion text,
  fecha_cierre timestamptz NOT NULL,
  fecha_sorteo timestamptz NOT NULL,
  loteria_referencia text,
  total_entradas integer NOT NULL CHECK (total_entradas > 0 AND total_entradas <= 99999),
  precio_por_entrada numeric NOT NULL CHECK (precio_por_entrada > 0),
  activo boolean DEFAULT true,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'finalizado')),
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de paquetes
CREATE TABLE IF NOT EXISTS paquetes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  cantidad_entradas integer NOT NULL CHECK (cantidad_entradas > 0),
  precio_total numeric NOT NULL CHECK (precio_total > 0),
  es_mas_popular boolean DEFAULT false,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de entradas
CREATE TABLE IF NOT EXISTS entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  numero_entrada integer NOT NULL CHECK (numero_entrada >= 1 AND numero_entrada <= 99999),
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservada', 'pagada', 'premiada')),
  correo_comprador text,
  compra_id uuid,
  es_bendecida boolean DEFAULT false,
  premio_id uuid,
  bloqueada boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evento_id, numero_entrada)
);

-- Crear tabla de compras
CREATE TABLE IF NOT EXISTS compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  correo_comprador text NOT NULL,
  nombre_comprador text NOT NULL,
  telefono text NOT NULL,
  cantidad_entradas integer NOT NULL CHECK (cantidad_entradas > 0),
  monto_total numeric NOT NULL CHECK (monto_total > 0),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  comprobante_url text,
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('transferencia', 'nequi')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de premios
CREATE TABLE IF NOT EXISTS premios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('principal', 'interno')),
  titulo text NOT NULL,
  descripcion text,
  imagen_url text,
  valor numeric NOT NULL CHECK (valor > 0),
  numero_ganador integer CHECK (numero_ganador >= 1 AND numero_ganador <= 99999),
  entrada_id uuid,
  publicado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de configuración de premios bendecidos
CREATE TABLE IF NOT EXISTS premios_bendecidos_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  entrada_id uuid NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  premio_id uuid NOT NULL REFERENCES premios(id) ON DELETE CASCADE,
  activacion_tipo text NOT NULL CHECK (activacion_tipo IN ('manual', 'porcentaje', 'inmediata')),
  activacion_porcentaje integer CHECK (activacion_porcentaje >= 0 AND activacion_porcentaje <= 100),
  activada boolean DEFAULT false,
  activada_en timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Agregar foreign keys que faltaban
ALTER TABLE entradas 
  ADD CONSTRAINT fk_entradas_compra 
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL;

ALTER TABLE entradas 
  ADD CONSTRAINT fk_entradas_premio 
  FOREIGN KEY (premio_id) REFERENCES premios(id) ON DELETE SET NULL;

ALTER TABLE premios 
  ADD CONSTRAINT fk_premios_entrada 
  FOREIGN KEY (entrada_id) REFERENCES entradas(id) ON DELETE SET NULL;

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_eventos_slug ON eventos(slug);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_activo ON eventos(activo);

CREATE INDEX IF NOT EXISTS idx_paquetes_evento ON paquetes(evento_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_activo ON paquetes(activo);

CREATE INDEX IF NOT EXISTS idx_entradas_evento ON entradas(evento_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estado ON entradas(estado);
CREATE INDEX IF NOT EXISTS idx_entradas_correo ON entradas(correo_comprador);
CREATE INDEX IF NOT EXISTS idx_entradas_compra ON entradas(compra_id);
CREATE INDEX IF NOT EXISTS idx_entradas_numero ON entradas(evento_id, numero_entrada);
CREATE INDEX IF NOT EXISTS idx_entradas_bendecida ON entradas(evento_id, es_bendecida) WHERE es_bendecida = true;
CREATE INDEX IF NOT EXISTS idx_entradas_disponibles ON entradas(evento_id, estado) WHERE estado = 'disponible' AND bloqueada = false;

CREATE INDEX IF NOT EXISTS idx_compras_evento ON compras(evento_id);
CREATE INDEX IF NOT EXISTS idx_compras_correo ON compras(correo_comprador);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado);

CREATE INDEX IF NOT EXISTS idx_premios_evento ON premios(evento_id);
CREATE INDEX IF NOT EXISTS idx_premios_tipo ON premios(tipo);

CREATE INDEX IF NOT EXISTS idx_premios_config_evento ON premios_bendecidos_config(evento_id);
CREATE INDEX IF NOT EXISTS idx_premios_config_entrada ON premios_bendecidos_config(entrada_id);

-- Habilitar Row Level Security
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios_bendecidos_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para eventos (solo admins autenticados)
CREATE POLICY "Admins can view all events"
  ON eventos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert events"
  ON eventos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update events"
  ON eventos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete events"
  ON eventos FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para paquetes
CREATE POLICY "Admins can view all packages"
  ON paquetes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert packages"
  ON paquetes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update packages"
  ON paquetes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete packages"
  ON paquetes FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para entradas
CREATE POLICY "Admins can view all entries"
  ON entradas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert entries"
  ON entradas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update entries"
  ON entradas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete entries"
  ON entradas FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para compras
CREATE POLICY "Admins can view all purchases"
  ON compras FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert purchases"
  ON compras FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update purchases"
  ON compras FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete purchases"
  ON compras FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para premios
CREATE POLICY "Admins can view all prizes"
  ON premios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert prizes"
  ON premios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update prizes"
  ON premios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete prizes"
  ON premios FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para configuración de premios bendecidos
CREATE POLICY "Admins can view blessed prizes config"
  ON premios_bendecidos_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert blessed prizes config"
  ON premios_bendecidos_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update blessed prizes config"
  ON premios_bendecidos_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete blessed prizes config"
  ON premios_bendecidos_config FOR DELETE
  TO authenticated
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at
  BEFORE UPDATE ON entradas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
