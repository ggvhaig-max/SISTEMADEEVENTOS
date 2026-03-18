/*
  # Solucionar conflicto de funciones duplicadas
  
  1. Problema
    - Existen dos versiones de get_well_distributed_entries
    - Una con 2 parámetros (p_evento_id, p_cantidad)
    - Otra con 3 parámetros (p_evento_id, p_cantidad, p_seed)
    - PostgreSQL no puede elegir cuál usar cuando se llama con 2 parámetros
    
  2. Solución
    - Eliminar TODAS las versiones existentes de la función
    - Crear solo una versión con 2 parámetros
    - Esta es la versión que el código está usando
*/

-- Eliminar todas las versiones de la función
DROP FUNCTION IF EXISTS get_well_distributed_entries(uuid, integer, text);
DROP FUNCTION IF EXISTS get_well_distributed_entries(uuid, integer);

-- Recrear la función correcta con solo 2 parámetros
CREATE OR REPLACE FUNCTION get_well_distributed_entries(
  p_evento_id uuid,
  p_cantidad integer
)
RETURNS TABLE (
  id uuid,
  numero_entrada integer,
  es_bendecida boolean,
  premio_valor numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_disponibles integer;
  v_salto integer;
BEGIN
  -- Contar total de entradas disponibles
  SELECT COUNT(*) INTO v_total_disponibles
  FROM entradas e
  WHERE e.evento_id = p_evento_id
    AND e.estado = 'disponible'
    AND e.bloqueada = false;
  
  -- Si hay suficientes entradas, calcular el salto para mejor distribución
  IF v_total_disponibles >= p_cantidad THEN
    v_salto := GREATEST(1, v_total_disponibles / (p_cantidad * 3));
    
    RETURN QUERY
    WITH numbered_entries AS (
      SELECT 
        e.id,
        e.numero_entrada,
        e.es_bendecida,
        e.premio_valor,
        ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
      FROM entradas e
      WHERE e.evento_id = p_evento_id
        AND e.estado = 'disponible'
        AND e.bloqueada = false
    )
    SELECT 
      ne.id,
      ne.numero_entrada,
      ne.es_bendecida,
      ne.premio_valor
    FROM numbered_entries ne
    WHERE (ne.rn - 1) % v_salto = 0
       OR ne.rn <= p_cantidad
    LIMIT p_cantidad;
  ELSE
    -- Si no hay suficientes, devolver lo que hay
    RETURN QUERY
    SELECT 
      e.id,
      e.numero_entrada,
      e.es_bendecida,
      e.premio_valor
    FROM entradas e
    WHERE e.evento_id = p_evento_id
      AND e.estado = 'disponible'
      AND e.bloqueada = false
    ORDER BY RANDOM()
    LIMIT p_cantidad;
  END IF;
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION get_well_distributed_entries(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_well_distributed_entries(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_well_distributed_entries(uuid, integer) TO service_role;