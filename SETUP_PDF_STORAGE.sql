-- Setup PDF Storage in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create the PDF storage bucket (if it doesn't exist)
-- Note: You'll need to create this bucket manually in the Supabase Dashboard
-- Go to Storage > New Bucket > Name: "post-pdfs" > Public bucket

-- 2. Set up storage policies for the post-pdfs bucket
-- This allows authenticated users to upload PDFs and anyone to view them

-- Policy for inserting PDFs (only authenticated users)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow authenticated users to upload PDFs',
  (SELECT id FROM storage.buckets WHERE name = 'post-pdfs'),
  'INSERT',
  'auth.role() = ''authenticated'''
)
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- Policy for viewing PDFs (public access)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow public to view PDFs',
  (SELECT id FROM storage.buckets WHERE name = 'post-pdfs'),
  'SELECT',
  'true'
)
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- Policy for updating PDFs (only the owner)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow users to update their own PDFs',
  (SELECT id FROM storage.buckets WHERE name = 'post-pdfs'),
  'UPDATE',
  'auth.uid()::text = (storage.foldername(name))[1]'
)
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- Policy for deleting PDFs (only the owner)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow users to delete their own PDFs',
  (SELECT id FROM storage.buckets WHERE name = 'post-pdfs'),
  'DELETE',
  'auth.uid()::text = (storage.foldername(name))[1]'
)
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- 3. Verify the bucket exists and policies are set
SELECT 
  b.name as bucket_name,
  p.name as policy_name,
  p.operation,
  p.definition
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
WHERE b.name = 'post-pdfs'
ORDER BY p.operation;

