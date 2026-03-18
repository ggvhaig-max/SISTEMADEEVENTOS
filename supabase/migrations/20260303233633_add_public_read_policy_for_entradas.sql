/*
  # Add public read access to entradas table

  1. Changes
    - Add policy to allow public read access to entradas table
    - This is needed for generating PDF receipts without authentication
    - The policy only allows SELECT operations
    - No sensitive data is exposed (just ticket numbers and prizes)
  
  2. Security
    - Read-only access for public users
    - Only admins can still insert, update, or delete
    - This allows ticket receipts to be generated and viewed publicly
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view entries" ON entradas;

-- Create new policy for public read access
CREATE POLICY "Public can view entries"
  ON entradas
  FOR SELECT
  TO anon, authenticated
  USING (true);
