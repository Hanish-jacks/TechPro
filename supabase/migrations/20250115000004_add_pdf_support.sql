-- Add PDF support to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_filename TEXT,
ADD COLUMN IF NOT EXISTS pdf_size BIGINT,
ADD COLUMN IF NOT EXISTS pdf_pages INTEGER;

-- Add index for PDF posts
CREATE INDEX IF NOT EXISTS idx_posts_pdf_url ON posts(pdf_url) WHERE pdf_url IS NOT NULL;

-- Update the media type constraint to include PDFs
-- First drop the existing constraint if it exists
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_media_type;

-- Add new constraint that includes PDFs
ALTER TABLE posts 
ADD CONSTRAINT check_media_type 
CHECK (
  (image_url IS NULL AND image_urls IS NULL AND video_url IS NULL AND pdf_url IS NULL) OR
  (image_url IS NOT NULL AND video_url IS NULL AND pdf_url IS NULL) OR
  (image_urls IS NOT NULL AND video_url IS NULL AND pdf_url IS NULL) OR
  (video_url IS NOT NULL AND image_url IS NULL AND image_urls IS NULL AND pdf_url IS NULL) OR
  (pdf_url IS NOT NULL AND image_url IS NULL AND image_urls IS NULL AND video_url IS NULL)
);
