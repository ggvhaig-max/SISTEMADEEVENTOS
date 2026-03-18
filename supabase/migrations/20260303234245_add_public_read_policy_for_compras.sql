/*
  # Add public read access to compras table

  1. Changes
    - Add policy to allow public read access to compras table
    - This is needed for generating PDF receipts and sharing tickets
    - The policy only allows SELECT operations
  
  2. Security
    - Read-only access for public users
    - Only admins can still insert, update, or delete
    - This allows ticket receipts to be generated and viewed publicly
*/

DROP POLICY IF EXISTS "Public can view purchases" ON compras;

CREATE POLICY "Public can view purchases"
  ON compras
  FOR SELECT
  TO anon, authenticated
  USING (true);
