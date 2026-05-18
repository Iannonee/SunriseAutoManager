/*
  # Create vehicles inventory table

  1. New Tables
    - `inventario`
      - `id` (uuid, PK)
      - `modello` (text)
      - `colore` (text)
      - `condizioni` (int, 1-5)
      - `prezzo_acquisto` (numeric)
      - `prezzo_vendita` (numeric, nullable)
      - `trattabile` (boolean)
      - `modifiche` (text, nullable)
      - `foto_url` (text, nullable)
      - `stato` (text: 'Da completare', 'Disponibile', 'In Trattativa', 'Venduto')
      - `note` (text, nullable)
      - `created_by` (uuid, FK to profiles)
      - `created_at` (timestamptz)

    - `auto_acquistate`
      - `id` (uuid, PK)
      - `modello` (text)
      - `colore` (text)
      - `prezzo_acquisto` (numeric)
      - `venduto_da` (text) - seller/contact name
      - `dipendente_id` (uuid, FK to profiles)
      - `data` (date)
      - `created_by` (uuid, FK to profiles)
      - `created_at` (timestamptz)

    - `veicoli_venduti`
      - `id` (uuid, PK)
      - `veicolo_id` (uuid, FK to inventario)
      - `prezzo_vendita_finale` (numeric)
      - `acquirente` (text)
      - `dipendente_id` (uuid, FK to profiles)
      - `data` (date)
      - `created_by` (uuid, FK to profiles)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - All authenticated users can read
    - All authenticated users can insert
    - Only admins can delete
*/

-- Inventario
CREATE TABLE IF NOT EXISTS inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modello text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '',
  condizioni int NOT NULL DEFAULT 3 CHECK (condizioni >= 1 AND condizioni <= 5),
  prezzo_acquisto numeric(10,2) NOT NULL DEFAULT 0,
  prezzo_vendita numeric(10,2),
  trattabile boolean NOT NULL DEFAULT false,
  modifiche text,
  foto_url text,
  stato text NOT NULL DEFAULT 'Da completare' CHECK (stato IN ('Da completare', 'Disponibile', 'In Trattativa', 'Venduto')),
  note text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventario"
  ON inventario FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventario"
  ON inventario FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update inventario"
  ON inventario FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete inventario"
  ON inventario FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Auto Acquistate
CREATE TABLE IF NOT EXISTS auto_acquistate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modello text NOT NULL DEFAULT '',
  colore text NOT NULL DEFAULT '',
  prezzo_acquisto numeric(10,2) NOT NULL DEFAULT 0,
  venduto_da text NOT NULL DEFAULT '',
  dipendente_id uuid REFERENCES profiles(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auto_acquistate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view auto_acquistate"
  ON auto_acquistate FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert auto_acquistate"
  ON auto_acquistate FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update auto_acquistate"
  ON auto_acquistate FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete auto_acquistate"
  ON auto_acquistate FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Veicoli Venduti
CREATE TABLE IF NOT EXISTS veicoli_venduti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veicolo_id uuid REFERENCES inventario(id),
  prezzo_vendita_finale numeric(10,2) NOT NULL DEFAULT 0,
  acquirente text NOT NULL DEFAULT '',
  dipendente_id uuid REFERENCES profiles(id),
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE veicoli_venduti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view veicoli_venduti"
  ON veicoli_venduti FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert veicoli_venduti"
  ON veicoli_venduti FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update veicoli_venduti"
  ON veicoli_venduti FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete veicoli_venduti"
  ON veicoli_venduti FOR DELETE
  TO authenticated
  USING (is_admin_role());
