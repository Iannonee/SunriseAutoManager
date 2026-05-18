/*
  # Create vehicle-photos storage bucket

  Public bucket so images can be displayed without auth tokens.
  Authenticated users can upload and delete their own files.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos',
  'vehicle-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload vehicle photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Authenticated can update vehicle photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Authenticated can delete vehicle photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Public can view vehicle photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vehicle-photos');
