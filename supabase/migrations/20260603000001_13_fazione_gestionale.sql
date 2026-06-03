-- Add ruolo_fazione to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ruolo_fazione text;
ALTER TABLE profiles ADD CONSTRAINT profiles_ruolo_fazione_check
  CHECK (ruolo_fazione IN ('Capo', 'Vicecapo', 'Mercenario', 'Soldato') OR ruolo_fazione IS NULL);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_fazione_leader()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT coalesce((SELECT ruolo_fazione IN ('Capo', 'Vicecapo') FROM profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.has_fazione_role()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT coalesce((SELECT ruolo_fazione IS NOT NULL FROM profiles WHERE id = auth.uid()), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_fazione_leader() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_fazione_role() TO authenticated;

-- fazione_membri
CREATE TABLE IF NOT EXISTS fazione_membri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  cognome text NOT NULL DEFAULT '',
  ruolo text NOT NULL DEFAULT '',
  stato boolean NOT NULL DEFAULT true,
  data_ingresso date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_membri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_membri_select" ON fazione_membri FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_membri_insert" ON fazione_membri FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_membri_update" ON fazione_membri FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_membri_delete" ON fazione_membri FOR DELETE TO authenticated USING (is_fazione_leader());

-- fazione_finanze
CREATE TABLE IF NOT EXISTS fazione_finanze (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descrizione text NOT NULL DEFAULT '',
  tipo text NOT NULL CHECK (tipo IN ('Entrata', 'Uscita')),
  importo numeric(12,2) NOT NULL DEFAULT 0,
  note text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_finanze ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_finanze_select" ON fazione_finanze FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_finanze_insert" ON fazione_finanze FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_finanze_update" ON fazione_finanze FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_finanze_delete" ON fazione_finanze FOR DELETE TO authenticated USING (is_fazione_leader());

-- fazione_percentuali
CREATE TABLE IF NOT EXISTS fazione_percentuali (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruolo text NOT NULL UNIQUE,
  percentuale numeric(5,2) NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_percentuali ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_pct_select" ON fazione_percentuali FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_pct_insert" ON fazione_percentuali FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_pct_update" ON fazione_percentuali FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
INSERT INTO fazione_percentuali (ruolo, percentuale) VALUES ('Capo', 30), ('Vicecapo', 25), ('Mercenario', 25), ('Soldato', 20) ON CONFLICT (ruolo) DO NOTHING;

-- fazione_operazioni
CREATE TABLE IF NOT EXISTS fazione_operazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL DEFAULT '',
  stato text NOT NULL DEFAULT 'In corso' CHECK (stato IN ('Completata', 'In corso', 'Fallita')),
  data date NOT NULL DEFAULT CURRENT_DATE,
  partecipanti integer NOT NULL DEFAULT 0,
  importo numeric(12,2) NOT NULL DEFAULT 0,
  note text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_operazioni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_op_select" ON fazione_operazioni FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_op_insert" ON fazione_operazioni FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_op_update" ON fazione_operazioni FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_op_delete" ON fazione_operazioni FOR DELETE TO authenticated USING (is_fazione_leader());

-- fazione_outfit
CREATE TABLE IF NOT EXISTS fazione_outfit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  ruoli_destinatari text[] NOT NULL DEFAULT '{}',
  descrizione text NOT NULL DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_outfit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_outfit_select" ON fazione_outfit FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_outfit_insert" ON fazione_outfit FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_outfit_update" ON fazione_outfit FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_outfit_delete" ON fazione_outfit FOR DELETE TO authenticated USING (is_fazione_leader());

-- fazione_codice
CREATE TABLE IF NOT EXISTS fazione_codice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  titolo text NOT NULL DEFAULT '',
  descrizione text NOT NULL DEFAULT '',
  ordine integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE fazione_codice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faz_codice_select" ON fazione_codice FOR SELECT TO authenticated USING (has_fazione_role());
CREATE POLICY "faz_codice_insert" ON fazione_codice FOR INSERT TO authenticated WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_codice_update" ON fazione_codice FOR UPDATE TO authenticated USING (is_fazione_leader()) WITH CHECK (is_fazione_leader());
CREATE POLICY "faz_codice_delete" ON fazione_codice FOR DELETE TO authenticated USING (is_fazione_leader());
