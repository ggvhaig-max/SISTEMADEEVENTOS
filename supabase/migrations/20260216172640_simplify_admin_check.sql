/*
  # Simplify Admin Check

  Since this is an admin-only system where ALL authenticated users are administrators,
  we simplify the is_admin() function to return true for any authenticated user.

  ## Changes
  - Update is_admin() function to check if user is authenticated
  - This means any user who successfully authenticates has full admin access
  - Public users access data through Edge Functions using service role

  ## Security Note
  - Only trusted administrators should be given login credentials
  - User registration should be controlled/approved
  - All authenticated users have full administrative privileges
*/

-- Update is_admin function to simply check authentication
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$;