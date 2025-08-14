-- Add video support to posts table
-- Run this in your Supabase SQL Editor

-- Add video columns
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER,
ADD COLUMN IF NOT EXISTS video_size BIGINT;

-- Add index for video posts
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts(video_url) WHERE video_url IS NOT NULL;

-- Add constraint to ensure either image or video, but not both
-- Comment this out if you get constraint violation errors
-- ALTER TABLE posts 
-- ADD CONSTRAINT check_media_type 
-- CHECK (
--   (image_url IS NULL AND image_urls IS NULL AND video_url IS NOT NULL) OR
--   (image_url IS NOT NULL AND video_url IS NULL) OR
--   (image_urls IS NOT NULL AND video_url IS NULL) OR
--   (image_url IS NULL AND image_urls IS NULL AND video_url IS NULL)
-- );

-- Update existing posts that might have video URLs in image_urls
-- This is a safety measure in case some posts were created with video URLs
UPDATE posts 
SET video_url = image_url, 
    image_url = NULL 
WHERE image_url LIKE '%.mp4' OR image_url LIKE '%.mov' OR image_url LIKE '%.avi' OR image_url LIKE '%.webm';

-- Verify the changes
SELECT id, content, image_url, image_urls, video_url, video_thumbnail_url 
FROM posts 
LIMIT 10;
