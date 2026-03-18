/*
  # Add public read access to eventos table

  1. Changes
    - Add policy to allow public read access to eventos table
    - This is needed for the public event landing pages and ticket receipts
    - The policy only allows SELECT operations
  
  2. Security
    - Read-only access for public users
    - Only admins can still insert, update, or delete
    - This allows public users to view event information
*/

DROP POLICY IF EXISTS "Public can view events" ON eventos;

CREATE POLICY "Public can view events"
  ON eventos
  FOR SELECT
  TO anon, authenticated
  USING (true);
