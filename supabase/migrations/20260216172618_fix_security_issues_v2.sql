/*
  # Fix Security Issues

  This migration addresses multiple security and performance issues:

  ## 1. Performance Improvements
  
  ### Add Missing Indexes for Foreign Keys
  - Add index on `entradas.premio_id` to improve joins with premios table
  - Add index on `premios.entrada_id` to improve reverse lookups
  - Add index on `premios_bendecidos_config.premio_id` to improve config queries

  ### Remove Unused Indexes
  - Remove `idx_eventos_estado` (not used in queries)
  - Remove `idx_eventos_activo` (not used in queries)
  - Remove `idx_paquetes_activo` (not used in queries)
  - Remove `idx_entradas_evento` (redundant with compound indexes)
  - Remove `idx_entradas_correo` (not used in queries)
  - Remove `idx_premios_tipo` (not used in queries)
  - Remove `idx_premios_config_entrada` (already covered by foreign key)

  ## 2. Security Improvements

  ### Fix Function Search Path
  - Set secure search_path for all functions to prevent search_path injection attacks
  - Functions will only use public schema explicitly

  ### Improve RLS Policies
  - Replace policies that use `USING (true)` with proper admin checks
  - Create admin role verification using auth metadata
  - Only allow authenticated users with admin flag in their metadata
  - Edge functions will continue to use service role for public access

  ## 3. Notes
  - Admin users must have `is_admin: true` in their `raw_app_meta_data`
  - Public access is handled through Edge Functions using service role
  - All authenticated non-admin users will be denied access
*/

-- ============================================
-- PART 1: Performance - Add Missing Indexes
-- ============================================

-- Add index for premio_id foreign key in entradas
CREATE INDEX IF NOT EXISTS idx_entradas_premio 
  ON entradas(premio_id) 
  WHERE premio_id IS NOT NULL;

-- Add index for entrada_id foreign key in premios
CREATE INDEX IF NOT EXISTS idx_premios_entrada 
  ON premios(entrada_id) 
  WHERE entrada_id IS NOT NULL;

-- Add index for premio_id foreign key in premios_bendecidos_config
CREATE INDEX IF NOT EXISTS idx_premios_config_premio 
  ON premios_bendecidos_config(premio_id);

-- ============================================
-- PART 2: Performance - Remove Unused Indexes
-- ============================================

DROP INDEX IF EXISTS idx_eventos_estado;
DROP INDEX IF EXISTS idx_eventos_activo;
DROP INDEX IF EXISTS idx_paquetes_activo;
DROP INDEX IF EXISTS idx_entradas_evento;
DROP INDEX IF EXISTS idx_entradas_correo;
DROP INDEX IF EXISTS idx_premios_tipo;
DROP INDEX IF EXISTS idx_premios_config_entrada;

-- ============================================
-- PART 3: Security - Fix Function Search Path
-- ============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_random_available_entries(uuid, integer);
DROP FUNCTION IF EXISTS get_well_distributed_entries(uuid, integer, text);

-- Recreate update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate get_random_available_entries function with secure search_path
CREATE OR REPLACE FUNCTION get_random_available_entries(
  p_evento_id uuid,
  p_cantidad integer
)
RETURNS TABLE (
  id uuid,
  numero_entrada integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.numero_entrada
  FROM entradas e
  WHERE e.evento_id = p_evento_id
    AND e.estado = 'disponible'
    AND e.bloqueada = false
    AND e.es_bendecida = false
  ORDER BY random()
  LIMIT p_cantidad;
END;
$$;

-- Recreate get_well_distributed_entries function with secure search_path
CREATE OR REPLACE FUNCTION get_well_distributed_entries(
  p_evento_id uuid,
  p_cantidad integer,
  p_seed text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  numero_entrada integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_total_entradas integer;
  v_interval numeric;
  v_offset integer;
BEGIN
  SELECT total_entradas INTO v_total_entradas
  FROM eventos
  WHERE id = p_evento_id;

  v_interval := v_total_entradas::numeric / (p_cantidad * 2);
  
  IF p_seed IS NOT NULL THEN
    PERFORM setseed(('0.' || substring(md5(p_seed) from 1 for 10))::numeric);
  END IF;

  v_offset := floor(random() * v_interval)::integer;

  RETURN QUERY
  WITH target_numbers AS (
    SELECT DISTINCT 
      ((row_number() OVER () - 1) * v_interval + v_offset + 
       floor(random() * (v_interval / 2)))::integer % v_total_entradas + 1 as target_num
    FROM generate_series(1, p_cantidad * 3)
    LIMIT p_cantidad * 2
  )
  SELECT e.id, e.numero_entrada
  FROM entradas e
  INNER JOIN target_numbers t 
    ON abs(e.numero_entrada - t.target_num) < v_interval / 4
  WHERE e.evento_id = p_evento_id
    AND e.estado = 'disponible'
    AND e.bloqueada = false
    AND e.es_bendecida = false
  ORDER BY random()
  LIMIT p_cantidad;
END;
$$;

-- ============================================
-- PART 4: Security - Improve RLS Policies
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================
-- EVENTOS - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all events" ON eventos;
DROP POLICY IF EXISTS "Admins can insert events" ON eventos;
DROP POLICY IF EXISTS "Admins can update events" ON eventos;
DROP POLICY IF EXISTS "Admins can delete events" ON eventos;

CREATE POLICY "Admins can view all events"
  ON eventos FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert events"
  ON eventos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update events"
  ON eventos FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete events"
  ON eventos FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- PAQUETES - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all packages" ON paquetes;
DROP POLICY IF EXISTS "Admins can insert packages" ON paquetes;
DROP POLICY IF EXISTS "Admins can update packages" ON paquetes;
DROP POLICY IF EXISTS "Admins can delete packages" ON paquetes;

CREATE POLICY "Admins can view all packages"
  ON paquetes FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert packages"
  ON paquetes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update packages"
  ON paquetes FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete packages"
  ON paquetes FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- ENTRADAS - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all entries" ON entradas;
DROP POLICY IF EXISTS "Admins can insert entries" ON entradas;
DROP POLICY IF EXISTS "Admins can update entries" ON entradas;
DROP POLICY IF EXISTS "Admins can delete entries" ON entradas;

CREATE POLICY "Admins can view all entries"
  ON entradas FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert entries"
  ON entradas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update entries"
  ON entradas FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete entries"
  ON entradas FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- COMPRAS - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all purchases" ON compras;
DROP POLICY IF EXISTS "Admins can insert purchases" ON compras;
DROP POLICY IF EXISTS "Admins can update purchases" ON compras;
DROP POLICY IF EXISTS "Admins can delete purchases" ON compras;

CREATE POLICY "Admins can view all purchases"
  ON compras FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert purchases"
  ON compras FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update purchases"
  ON compras FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete purchases"
  ON compras FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- PREMIOS - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all prizes" ON premios;
DROP POLICY IF EXISTS "Admins can insert prizes" ON premios;
DROP POLICY IF EXISTS "Admins can update prizes" ON premios;
DROP POLICY IF EXISTS "Admins can delete prizes" ON premios;

CREATE POLICY "Admins can view all prizes"
  ON premios FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert prizes"
  ON premios FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update prizes"
  ON premios FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete prizes"
  ON premios FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- PREMIOS_BENDECIDOS_CONFIG - Replace RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view blessed prizes config" ON premios_bendecidos_config;
DROP POLICY IF EXISTS "Admins can insert blessed prizes config" ON premios_bendecidos_config;
DROP POLICY IF EXISTS "Admins can update blessed prizes config" ON premios_bendecidos_config;
DROP POLICY IF EXISTS "Admins can delete blessed prizes config" ON premios_bendecidos_config;

CREATE POLICY "Admins can view blessed prizes config"
  ON premios_bendecidos_config FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert blessed prizes config"
  ON premios_bendecidos_config FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update blessed prizes config"
  ON premios_bendecidos_config FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete blessed prizes config"
  ON premios_bendecidos_config FOR DELETE
  TO authenticated
  USING (is_admin());