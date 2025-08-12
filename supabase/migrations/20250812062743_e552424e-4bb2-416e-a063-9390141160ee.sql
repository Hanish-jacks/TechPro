-- Ensure public buckets exist and are correctly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Harden avatars bucket policies (idempotent: drop and recreate)
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects';
EXCEPTION WHEN undefined_object THEN
  -- ignore
END $$;

-- Allow authenticated users to upload into their own folder: {user_id}/...
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for avatars (needed for rendering), scoped to bucket only
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Secure updates with USING + WITH CHECK to prevent path hijacking
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own objects
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Harden post-images bucket policies similarly
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Public can view post images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects';
EXCEPTION WHEN undefined_object THEN
  -- ignore
END $$;

-- Public read for post images
CREATE POLICY "Public can view post images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-images');

-- Insert restricted to owner's folder
CREATE POLICY "Users can upload post images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update with USING + WITH CHECK
CREATE POLICY "Users can update their own post images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete restricted to owner
CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );