/*
  # Crear función para seleccionar entradas aleatorias

  1. Nueva Función
    - `get_random_available_entries` - Selecciona entradas disponibles de forma aleatoria
    - Parámetros:
      - `p_evento_id` (uuid) - ID del evento
      - `p_cantidad` (integer) - Cantidad de entradas a seleccionar
    - Retorna: Array de entradas con id, numero_entrada, es_bendecida, premio_valor
    
  2. Funcionalidad
    - Usa ORDER BY RANDOM() para verdadera aleatoriedad
    - Solo selecciona entradas disponibles y no bloqueadas
    - Limita resultados a la cantidad solicitada
*/

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