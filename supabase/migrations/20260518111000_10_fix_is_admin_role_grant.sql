/*
  # Fix is_admin_role() EXECUTE grant

  Migration 07 revoked EXECUTE on is_admin_role() from the authenticated role
  to prevent direct RPC calls, but RLS policies execute in the context of the
  calling user — so revoking from authenticated breaks every policy that calls
  this function.

  Fix: grant EXECUTE back to authenticated.
  Keeping it revoked from public and anon is sufficient to block unauthenticated
  direct RPC calls. The function only reads profiles and returns a boolean,
  so there is no privilege escalation risk.
*/

GRANT EXECUTE ON FUNCTION public.is_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
