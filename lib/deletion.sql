-- ============================================================================
-- ACCOUNT DELETION SQL
-- ============================================================================
-- This script creates a secure function that allows an authenticated user
-- to delete their own account and all associated data.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to access auth.users
SET search_path = public
AS $$
BEGIN
  -- Verify the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users
  -- This will trigger CASCADE deletes for all linked tables:
  -- accounts, categories, records, budgets, profiles
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.delete_user() IS 'Safely allows a user to delete their own account and all cascading data.';
