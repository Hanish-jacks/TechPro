-- Fix PDF Storage Policies - Run this in Supabase SQL Editor
-- This will resolve the "new row violates row-level security policy" error

-- First, make sure the post-pdfs bucket exists
-- If it doesn't exist, create it manually in the Supabase Dashboard:
-- Storage → New Bucket → Name: "post-pdfs" → Public: ON

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read for post pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload post pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their post pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their post pdfs" ON storage.objects;

-- Create new policies for the post-pdfs bucket

-- 1. Public read access (anyone can view PDFs)
CREATE POLICY "Public read for post pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-pdfs');

-- 2. Authenticated users can upload PDFs (path must start with their user ID)
CREATE POLICY "Users can upload post pdfs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-pdfs'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Users can update their own PDFs
CREATE POLICY "Users can update their post pdfs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Users can delete their own PDFs
CREATE POLICY "Users can delete their post pdfs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Also add policies for post-videos bucket (if it doesn't exist)
DROP POLICY IF EXISTS "Public read for post videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload post videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their post videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their post videos" ON storage.objects;

-- Create policies for post-videos bucket
CREATE POLICY "Public read for post videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-videos');

CREATE POLICY "Users can upload post videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-videos'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their post videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their post videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (qual LIKE '%post-pdfs%' OR qual LIKE '%post-videos%' OR with_check LIKE '%post-pdfs%' OR with_check LIKE '%post-videos%')
ORDER BY policyname;
