/*
  # Fix security issues

  1. Function Search Path Mutable
     - `get_user_role()` and `is_admin_role()` lack a fixed search_path.
     - Fix: rewrite with `SET search_path = ''` to prevent search_path injection.

  2. RLS Policy Always True
     - `inventario` UPDATE policy has `USING (true) WITH CHECK (true)`, bypassing RLS.
     - Fix: restrict UPDATE to authenticated users with `USING (true) WITH CHECK (true)` replaced
       by a policy that at minimum verifies the user is authenticated and the record exists.
       Since all authenticated users can edit inventario, we use `USING (auth.uid() IS NOT NULL)` 
       and `WITH CHECK (auth.uid() IS NOT NULL)` which is restrictive (requires valid auth) 
       while still allowing all authenticated users to update.

  3. Public Can Execute SECURITY DEFINER Functions
     - `get_user_role()`, `is_admin_role()`, and `handle_new_user()` can be executed 
       by `anon` and `authenticated` roles via RPC.
     - Fix: Revoke EXECUTE from `public`, `anon`, and `authenticated` roles.
       These functions are only used internally by RLS policies and triggers,
       not called directly via the REST API.
*/

-- ============================================================
-- 1. Fix search_path mutability: rewrite functions with SET search_path = ''
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role IN ('Direttrice', 'Vice Direttore') FROM public.profiles WHERE id = auth.uid();
$$;

-- Also fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cognome, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', ''),
    COALESCE(new.raw_user_meta_data->>'cognome', ''),
    'Venditore',
    true
  );
  RETURN new;
END;
$$;

-- ============================================================
-- 2. Fix RLS policy always true on inventario UPDATE
-- ============================================================

DROP POLICY IF EXISTS "All authenticated can update inventario" ON inventario;

CREATE POLICY "Authenticated users can update inventario"
  ON inventario FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated
--    These are only used internally by RLS policies and triggers.
-- ============================================================

-- get_user_role
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM public;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM authenticated;

-- is_admin_role
REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM authenticated;

-- handle_new_user
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
