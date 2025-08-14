-- Add video support to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER,
ADD COLUMN IF NOT EXISTS video_size BIGINT;

-- Add index for video posts
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts(video_url) WHERE video_url IS NOT NULL;

-- Add constraint to ensure either image or video, but not both
ALTER TABLE posts 
ADD CONSTRAINT check_media_type 
CHECK (
  (image_url IS NULL AND image_urls IS NULL AND video_url IS NOT NULL) OR
  (image_url IS NOT NULL AND video_url IS NULL) OR
  (image_urls IS NOT NULL AND video_url IS NULL) OR
  (image_url IS NULL AND image_urls IS NULL AND video_url IS NULL)
);
