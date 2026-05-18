/*
  # Fix DELETE policies on vehicle tables

  is_admin_role() had EXECUTE revoked from the authenticated role (migration 07)
  to prevent direct RPC calls, but the DELETE RLS policies still reference it,
  causing "permission denied for function is_admin_role" on every delete attempt.

  Fix: replace the function call with an inline subquery so no EXECUTE grant is needed.
*/

-- Inventario
DROP POLICY IF EXISTS "Admins can delete inventario" ON inventario;
CREATE POLICY "Admins can delete inventario"
  ON inventario FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('Direttrice', 'Vice Direttore')
    )
  );

-- Auto Acquistate
DROP POLICY IF EXISTS "Admins can delete auto_acquistate" ON auto_acquistate;
CREATE POLICY "Admins can delete auto_acquistate"
  ON auto_acquistate FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('Direttrice', 'Vice Direttore')
    )
  );

-- Veicoli Venduti
DROP POLICY IF EXISTS "Admins can delete veicoli_venduti" ON veicoli_venduti;
CREATE POLICY "Admins can delete veicoli_venduti"
  ON veicoli_venduti FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('Direttrice', 'Vice Direttore')
    )
  );
