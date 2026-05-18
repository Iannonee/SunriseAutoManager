/*
  # Rewrite all RLS policies for precise role-based access

  This migration drops ALL existing policies on every table and recreates them
  according to the exact permission map specified.

  Permission summary:
  - INVENTARIO: view/add/edit all roles; delete admin only
  - AUTO ACQUISTATE: view/add all; edit/delete admin only
  - VEICOLI VENDUTI: view/add all; edit/delete admin only
  - TURNI: view own for all, view all for admin; add own for all; edit own for all, edit any for admin; delete admin only
  - COMUNICAZIONI: view/write all; delete own for all, delete any for admin
  - BLACKLIST CLIENTI: view all; add for Responsabile Vendite+; edit/delete admin only
  - BILANCIO: full access admin only
  - COMUNICAZIONI STAFF: view all; write/delete admin only
  - CHAT ADMIN: full access admin only
  - PROFILES: view all; insert own; update own or admin
*/

-- ============================================================
-- Drop ALL existing policies
-- ============================================================

-- inventario
DROP POLICY IF EXISTS "Authenticated users can view inventario" ON inventario;
DROP POLICY IF EXISTS "Authenticated users can insert inventario" ON inventario;
DROP POLICY IF EXISTS "Authenticated users can update inventario" ON inventario;
DROP POLICY IF EXISTS "Admins can delete inventario" ON inventario;

-- auto_acquistate
DROP POLICY IF EXISTS "Authenticated users can view auto_acquistate" ON auto_acquistate;
DROP POLICY IF EXISTS "Authenticated users can insert auto_acquistate" ON auto_acquistate;
DROP POLICY IF EXISTS "Authenticated users can update auto_acquistate" ON auto_acquistate;
DROP POLICY IF EXISTS "Admins can delete auto_acquistate" ON auto_acquistate;

-- veicoli_venduti
DROP POLICY IF EXISTS "Authenticated users can view veicoli_venduti" ON veicoli_venduti;
DROP POLICY IF EXISTS "Authenticated users can insert veicoli_venduti" ON veicoli_venduti;
DROP POLICY IF EXISTS "Authenticated users can update veicoli_venduti" ON veicoli_venduti;
DROP POLICY IF EXISTS "Admins can delete veicoli_venduti" ON veicoli_venduti;

-- turni
DROP POLICY IF EXISTS "Authenticated users can view turni" ON turni;
DROP POLICY IF EXISTS "Authenticated users can insert turni" ON turni;
DROP POLICY IF EXISTS "Admins can update turni" ON turni;
DROP POLICY IF EXISTS "Admins can delete turni" ON turni;

-- comunicazioni
DROP POLICY IF EXISTS "Authenticated users can view comunicazioni" ON comunicazioni;
DROP POLICY IF EXISTS "Authenticated users can insert comunicazioni" ON comunicazioni;
DROP POLICY IF EXISTS "Admins can delete comunicazioni" ON comunicazioni;

-- blacklist_clienti
DROP POLICY IF EXISTS "Authenticated users can view blacklist_clienti" ON blacklist_clienti;
DROP POLICY IF EXISTS "Managers+ can insert blacklist_clienti" ON blacklist_clienti;
DROP POLICY IF EXISTS "Admins can update blacklist_clienti" ON blacklist_clienti;
DROP POLICY IF EXISTS "Admins can delete blacklist_clienti" ON blacklist_clienti;

-- bilancio
DROP POLICY IF EXISTS "Admins can view bilancio" ON bilancio;
DROP POLICY IF EXISTS "Admins can insert bilancio" ON bilancio;
DROP POLICY IF EXISTS "Admins can update bilancio" ON bilancio;
DROP POLICY IF EXISTS "Admins can delete bilancio" ON bilancio;

-- comunicazioni_staff
DROP POLICY IF EXISTS "Authenticated users can view comunicazioni_staff" ON comunicazioni_staff;
DROP POLICY IF EXISTS "Admins can insert comunicazioni_staff" ON comunicazioni_staff;
DROP POLICY IF EXISTS "Admins can update comunicazioni_staff" ON comunicazioni_staff;
DROP POLICY IF EXISTS "Admins can delete comunicazioni_staff" ON comunicazioni_staff;

-- chat_admin
DROP POLICY IF EXISTS "Admins can view chat_admin" ON chat_admin;
DROP POLICY IF EXISTS "Admins can insert chat_admin" ON chat_admin;
DROP POLICY IF EXISTS "Admins can delete chat_admin" ON chat_admin;

-- profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================================
-- Recreate all policies
-- ============================================================

-- INVENTARIO: view/add/edit all; delete admin only
CREATE POLICY "All authenticated can view inventario"
  ON inventario FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert inventario"
  ON inventario FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "All authenticated can update inventario"
  ON inventario FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete inventario"
  ON inventario FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- AUTO ACQUISTATE: view/add all; edit/delete admin only
CREATE POLICY "All authenticated can view auto_acquistate"
  ON auto_acquistate FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert auto_acquistate"
  ON auto_acquistate FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update auto_acquistate"
  ON auto_acquistate FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete auto_acquistate"
  ON auto_acquistate FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- VEICOLI VENDUTI: view/add all; edit/delete admin only
CREATE POLICY "All authenticated can view veicoli_venduti"
  ON veicoli_venduti FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert veicoli_venduti"
  ON veicoli_venduti FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update veicoli_venduti"
  ON veicoli_venduti FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete veicoli_venduti"
  ON veicoli_venduti FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- TURNI: view own for all, view all for admin; add own; edit own for all, edit any for admin; delete admin only
CREATE POLICY "View own turni or all for admins"
  ON turni FOR SELECT
  TO authenticated
  USING (
    is_admin_role() OR created_by = auth.uid()
  );

CREATE POLICY "Insert own turno"
  ON turni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Update own turno or any for admins"
  ON turni FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_role())
  WITH CHECK (created_by = auth.uid() OR is_admin_role());

CREATE POLICY "Admins can delete turni"
  ON turni FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- COMUNICAZIONI: view/write all; delete own for all, delete any for admin
CREATE POLICY "All authenticated can view comunicazioni"
  ON comunicazioni FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert comunicazioni"
  ON comunicazioni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = autore_id);

CREATE POLICY "Delete own comunicazioni or any for admins"
  ON comunicazioni FOR DELETE
  TO authenticated
  USING (autore_id = auth.uid() OR is_admin_role());

-- BLACKLIST CLIENTI: view all; add for Responsabile Vendite+; edit/delete admin only
CREATE POLICY "All authenticated can view blacklist_clienti"
  ON blacklist_clienti FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers+ can insert blacklist_clienti"
  ON blacklist_clienti FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    get_user_role() IN ('Direttrice', 'Vice Direttore', 'Responsabile Vendite')
  );

CREATE POLICY "Admins can update blacklist_clienti"
  ON blacklist_clienti FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete blacklist_clienti"
  ON blacklist_clienti FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- BILANCIO: full access admin only
CREATE POLICY "Admins can view bilancio"
  ON bilancio FOR SELECT
  TO authenticated
  USING (is_admin_role());

CREATE POLICY "Admins can insert bilancio"
  ON bilancio FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_role() AND auth.uid() = compilato_da_id);

CREATE POLICY "Admins can update bilancio"
  ON bilancio FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete bilancio"
  ON bilancio FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- COMUNICAZIONI STAFF: view all; write/delete admin only
CREATE POLICY "All authenticated can view comunicazioni_staff"
  ON comunicazioni_staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert comunicazioni_staff"
  ON comunicazioni_staff FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_role() AND auth.uid() = created_by);

CREATE POLICY "Admins can update comunicazioni_staff"
  ON comunicazioni_staff FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete comunicazioni_staff"
  ON comunicazioni_staff FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- CHAT ADMIN: full access admin only
CREATE POLICY "Admins can view chat_admin"
  ON chat_admin FOR SELECT
  TO authenticated
  USING (is_admin_role());

CREATE POLICY "Admins can insert chat_admin"
  ON chat_admin FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_role() AND auth.uid() = mittente_id);

CREATE POLICY "Admins can delete chat_admin"
  ON chat_admin FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- PROFILES: view all; insert own; update own or admin
CREATE POLICY "All authenticated can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
