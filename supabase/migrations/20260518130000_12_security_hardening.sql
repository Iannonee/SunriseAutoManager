/*
  # Security Hardening — Full Audit Fixes
  Date: 2026-05-18

  Issues addressed:

  1. [MEDIUM] handle_new_user() uses SET search_path = public  (migrations 07, 08)
     — Rewrite with SET search_path = '' to prevent search_path injection.
     'public' is a user-controlled schema; '' forces fully-qualified names only.

  2. [MEDIUM] Storage policies for vehicle-photos have no path restriction
     — Any authenticated user could overwrite or delete another user's photo.
     — Fix: restrict INSERT/UPDATE/DELETE to objects whose name starts with
       the uploading user's own UUID prefix, OR is an admin.
     — Note: the frontend already names files as `<vehicleId>.<ext>`, not
       per-user, so we keep the existing "any authenticated user can manage
       vehicle photos" but add an explicit bucket_id guard to prevent
       accidental cross-bucket access. True per-user isolation would require
       a path scheme change; the admin-only delete path is enforced via RLS
       on the inventario table itself.

  3. [MEDIUM] inventario UPDATE policy USING (auth.uid() IS NOT NULL)
     — Semantically identical to USING (true) — any authenticated user can
       update any inventory record regardless of ownership.
     — Per the design spec "all roles can edit inventario", this is intentional.
       However, we harden the WITH CHECK to prevent a user from re-assigning
       created_by to another user's ID.

  4. [LOW] profiles UPDATE policies: two overlapping UPDATE policies
     — "Admins can update any profile" and "Users can update own profile" both
       exist. A non-admin user can update their own profile including the `role`
       and `is_active` fields, effectively granting themselves admin privileges.
     — Fix: drop the generic self-update policy and replace it with a restricted
       version that only allows updating `nome`, `cognome`, and `discord_username`
       (not `role` or `is_active`). Admins keep unrestricted update on any profile.

  5. [LOW] get_user_role() / is_admin_role() lack search_path hardening
     — Already fixed in migration 07 but handle_new_user still uses 'public'.
     — Re-fix handle_new_user to use SET search_path = ''.
*/

-- ============================================================
-- 1. Fix handle_new_user search_path: '' instead of 'public'
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cognome, role, is_active, discord_username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', ''),
    COALESCE(new.raw_user_meta_data->>'cognome', ''),
    '',
    true,
    COALESCE(
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      ''
    )
  );
  RETURN new;
EXCEPTION WHEN unique_violation THEN
  -- Profile already exists (race condition between getSession and onAuthStateChange).
  RETURN new;
END;
$$;

-- ============================================================
-- 2. Harden inventario UPDATE: prevent created_by tampering
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can update inventario" ON public.inventario;
DROP POLICY IF EXISTS "All authenticated can update inventario" ON public.inventario;

CREATE POLICY "Authenticated users can update inventario"
  ON public.inventario FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (
    auth.uid() IS NOT NULL
    -- Prevent re-assigning created_by to a different user
    AND (created_by = auth.uid() OR created_by IS NULL OR
         EXISTS (
           SELECT 1 FROM public.profiles
           WHERE id = auth.uid()
           AND role IN ('Direttrice', 'Vice Direttore')
         ))
  );

-- ============================================================
-- 3. Fix profiles UPDATE: restrict non-admin self-update
--    to safe fields only (nome, cognome, discord_username).
--    Prevents privilege escalation via self-assigning role/is_active.
-- ============================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Admins can update any field on any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('Direttrice', 'Vice Direttore')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('Direttrice', 'Vice Direttore')
    )
  );

-- Non-admin users can only update their own nome, cognome, discord_username.
-- The WITH CHECK ensures role and is_active cannot be changed by the user themselves.
CREATE POLICY "Users can update own safe fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-escalation: role and is_active must remain unchanged
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- 4. Ensure storage bucket policies have explicit bucket_id guard
--    (belt-and-suspenders: policies are already bucket-scoped but
--     we make the intent explicit and prevent path traversal)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vehicle photos" ON storage.objects;

CREATE POLICY "Authenticated can upload vehicle photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] IS DISTINCT FROM '..'
  );

CREATE POLICY "Authenticated can update vehicle photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] IS DISTINCT FROM '..'
  )
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] IS DISTINCT FROM '..'
  );

-- Only admins can delete vehicle photos
CREATE POLICY "Admins can delete vehicle photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('Direttrice', 'Vice Direttore')
    )
  );

CREATE POLICY "Public can view vehicle photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vehicle-photos');

-- ============================================================
-- 5. Add length constraints to profiles to prevent DB-level
--    unbounded input (defence-in-depth alongside frontend validation)
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN nome TYPE varchar(100),
  ALTER COLUMN cognome TYPE varchar(100),
  ALTER COLUMN discord_username TYPE varchar(100),
  ALTER COLUMN role TYPE varchar(50);

-- ============================================================
-- 6. Add length constraints to comunicazioni / chat_admin
--    to prevent oversized message payloads
-- ============================================================

ALTER TABLE public.comunicazioni
  ALTER COLUMN testo TYPE varchar(2000);

ALTER TABLE public.chat_admin
  ALTER COLUMN messaggio TYPE varchar(2000);
