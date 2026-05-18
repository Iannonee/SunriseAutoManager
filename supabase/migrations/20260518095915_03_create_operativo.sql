/*
  # Create operativo tables

  1. New Tables
    - `turni` - work shifts
      - `id`, `dipendente_id`, `data`, `ora_inizio`, `ora_fine`, `ore_totali`, `created_by`, `created_at`
    
    - `comunicazioni` - message board (all staff)
      - `id`, `testo`, `autore_id`, `created_at`
    
    - `blacklist_clienti` - client blacklist
      - `id`, `nome_cliente`, `data`, `motivo`, `aggiunto_da_id`, `note`, `created_by`, `created_at`

  2. Security
    - RLS enabled
    - Turni: all can read/insert; only admins can update/delete
    - Comunicazioni: all can read/write
    - Blacklist: all can read; Responsabile Vendite+ can insert; only admins can update/delete
*/

-- Turni
CREATE TABLE IF NOT EXISTS turni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dipendente_id uuid REFERENCES profiles(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  ora_inizio time NOT NULL,
  ora_fine time NOT NULL,
  ore_totali numeric(4,2) NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE turni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view turni"
  ON turni FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert turni"
  ON turni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update turni"
  ON turni FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Admins can delete turni"
  ON turni FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Comunicazioni (bacheca)
CREATE TABLE IF NOT EXISTS comunicazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testo text NOT NULL DEFAULT '',
  autore_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comunicazioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comunicazioni"
  ON comunicazioni FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comunicazioni"
  ON comunicazioni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = autore_id);

CREATE POLICY "Admins can delete comunicazioni"
  ON comunicazioni FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Blacklist Clienti
CREATE TABLE IF NOT EXISTS blacklist_clienti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  motivo text NOT NULL DEFAULT '',
  aggiunto_da_id uuid REFERENCES profiles(id),
  note text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blacklist_clienti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view blacklist_clienti"
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
