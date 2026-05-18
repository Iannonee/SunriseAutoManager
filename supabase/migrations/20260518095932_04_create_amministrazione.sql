/*
  # Create amministrazione tables

  1. New Tables
    - `bilancio` - daily financial log
      - `id`, `data`, `compilato_da_id`, `veicoli_acquistati`, `totale_speso`, `veicoli_venduti`, `totale_incassato`, `saldo_giornaliero`, `note`, `created_at`
    
    - `comunicazioni_staff` - official staff communications
      - `id`, `tipo`, `dipendente_id`, `da_ruolo`, `a_ruolo`, `data`, `motivazione`, `created_by`, `created_at`
    
    - `chat_admin` - private admin chat
      - `id`, `mittente_id`, `messaggio`, `created_at`

  2. Security
    - RLS enabled
    - All tables restricted to Direttrice and Vice Direttore only
    - comunicazioni_staff is readable by all staff (read-only)
*/

-- Bilancio
CREATE TABLE IF NOT EXISTS bilancio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  compilato_da_id uuid REFERENCES profiles(id),
  veicoli_acquistati int NOT NULL DEFAULT 0,
  totale_speso numeric(12,2) NOT NULL DEFAULT 0,
  veicoli_venduti int NOT NULL DEFAULT 0,
  totale_incassato numeric(12,2) NOT NULL DEFAULT 0,
  saldo_giornaliero numeric(12,2) GENERATED ALWAYS AS (totale_incassato - totale_speso) STORED,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bilancio ENABLE ROW LEVEL SECURITY;

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

-- Comunicazioni Staff
CREATE TABLE IF NOT EXISTS comunicazioni_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('Promozione', 'Retrocessione', 'Richiamo Verbale', 'Richiamo Ufficiale', 'Retrocessione Disciplinare', 'Espulsione')),
  dipendente_id uuid REFERENCES profiles(id),
  da_ruolo text,
  a_ruolo text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  motivazione text NOT NULL DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comunicazioni_staff ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (staff communications visible to all)
CREATE POLICY "Authenticated users can view comunicazioni_staff"
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

-- Chat Admin
CREATE TABLE IF NOT EXISTS chat_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mittente_id uuid REFERENCES profiles(id),
  messaggio text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_admin ENABLE ROW LEVEL SECURITY;

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
