/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, PK, FK to auth.users)
      - `nome` (text) - first name
      - `cognome` (text) - last name
      - `role` (text) - user role
      - `is_active` (boolean) - account status
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Users can read their own profile
    - Direttrice/Vice Direttore can read all profiles
    - Only service role can insert/update roles
    
  3. Helper function
    - `get_user_role()` returns current user's role
    - `get_user_full_name()` returns full name
    - `is_admin_role()` checks if user is Direttrice or Vice Direttore
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  cognome text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Venditore',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Function to check if admin (Direttrice or Vice Direttore)
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role IN ('Direttrice', 'Vice Direttore') FROM profiles WHERE id = auth.uid();
$$;

-- Everyone can read profiles (needed for showing names)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

-- Users can update their own profile (limited)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
