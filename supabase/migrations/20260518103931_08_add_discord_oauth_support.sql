/*
  # Add Discord OAuth support to profiles

  1. Changes
    - Add `discord_username` column to profiles (text, nullable)
    - Update `handle_new_user()` trigger to extract Discord username 
      from raw_user_meta_data and set default role to empty string
      (instead of 'Venditore') so we can detect unassigned users
  
  2. Notes
    - Discord OAuth stores the username in raw_user_meta_data->>'full_name' 
      or raw_user_meta_data->>'preferred_username' or raw_user_meta_data->>'name'
    - New users get role = '' (empty) until an admin assigns one
    - The trigger still auto-creates the profile, but nome/cognome will be empty
      until the user fills in the RP name form on first login
*/

-- Add discord_username column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discord_username text;
  END IF;
END $$;

-- Update trigger function for Discord OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
END;
$$;
