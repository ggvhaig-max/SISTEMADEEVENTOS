/*
  # Otorgar permisos a la función de entradas aleatorias

  1. Cambios
    - Modificar la función para que sea SECURITY DEFINER
    - Otorgar permisos de ejecución a todos los roles
    
  2. Propósito
    - Permitir que la edge function ejecute la función sin problemas de permisos
*/

-- Recrear la función con SECURITY DEFINER
DROP FUNCTION IF EXISTS get_random_available_entries(uuid, integer);

CREATE OR REPLACE FUNCTION get_random_available_entries(
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
BEGIN
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
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_random_available_entries(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_random_available_entries(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_random_available_entries(uuid, integer) TO service_role;