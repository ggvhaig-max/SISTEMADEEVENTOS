/*
  # Hacer fecha_cierre y fecha_sorteo opcionales

  1. Changes
    - Cambiar columna fecha_cierre de NOT NULL a NULL en tabla eventos
    - Cambiar columna fecha_sorteo de NOT NULL a NULL en tabla eventos
    
  2. Reasoning
    - Permitir que los eventos se creen sin fecha de cierre específica
    - Permitir que los eventos se realicen cuando se complete el 100% de ventas sin fecha específica del sorteo
*/

ALTER TABLE eventos 
ALTER COLUMN fecha_cierre DROP NOT NULL;

ALTER TABLE eventos 
ALTER COLUMN fecha_sorteo DROP NOT NULL;