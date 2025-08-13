-- Add support for multiple images per post
-- This migration changes the single image_url field to image_urls as a JSON array

-- First, create a backup of existing image_url data
CREATE TABLE IF NOT EXISTS posts_backup AS 
SELECT id, image_url FROM public.posts WHERE image_url IS NOT NULL;

-- Add the new image_urls column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single images to the new array format
UPDATE public.posts 
SET image_urls = CASE 
  WHEN image_url IS NOT NULL THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE image_urls IS NULL OR image_urls = '[]'::jsonb;

-- Create an index for the image_urls column for better performance
CREATE INDEX IF NOT EXISTS idx_posts_image_urls_gin ON public.posts USING gin(image_urls);

-- Add a check constraint to ensure image_urls is always an array
ALTER TABLE public.posts 
ADD CONSTRAINT check_image_urls_array 
CHECK (jsonb_typeof(image_urls) = 'array');

-- Create a function to validate image URLs
CREATE OR REPLACE FUNCTION validate_image_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure image_urls is always an array
  IF jsonb_typeof(NEW.image_urls) != 'array' THEN
    RAISE EXCEPTION 'image_urls must be an array';
  END IF;
  
  -- Ensure all elements in the array are strings
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(NEW.image_urls) AS elem
    WHERE jsonb_typeof(elem) != 'string'
  ) THEN
    RAISE EXCEPTION 'All elements in image_urls must be strings';
  END IF;
  
  -- Limit to maximum 10 images per post
  IF jsonb_array_length(NEW.image_urls) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images allowed per post';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate image_urls
DROP TRIGGER IF EXISTS validate_image_urls_trigger ON public.posts;
CREATE TRIGGER validate_image_urls_trigger
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_image_urls();

-- Update the search function to work with the new image_urls field
CREATE OR REPLACE FUNCTION search_all(query text)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  subtitle text,
  content text,
  image_urls jsonb,
  created_at timestamptz,
  user_id uuid,
  username text,
  relevance float
) AS $$
BEGIN
  RETURN QUERY
  -- Search profiles
  SELECT 
    p.id,
    'profile'::text as type,
    COALESCE(p.full_name, p.username) as title,
    '@' || p.username as subtitle,
    NULL::text as content,
    NULL::jsonb as image_urls,
    p.created_at,
    p.id as user_id,
    p.username,
    GREATEST(
      similarity(p.username, query),
      similarity(COALESCE(p.full_name, ''), query)
    ) as relevance
  FROM public.profiles p
  WHERE 
    p.username ILIKE '%' || query || '%' OR
    p.full_name ILIKE '%' || query || '%'
  
  UNION ALL
  
  -- Search posts
  SELECT 
    po.id,
    'post'::text as type,
    LEFT(po.content, 100) as title,
    'by ' || COALESCE(pr.full_name, pr.username) as subtitle,
    po.content,
    po.image_urls,
    po.created_at,
    po.user_id,
    pr.username,
    similarity(po.content, query) as relevance
  FROM public.posts po
  JOIN public.profiles pr ON po.user_id = pr.id
  WHERE po.content ILIKE '%' || query || '%'
  
  ORDER BY relevance DESC, created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the updated search function
GRANT EXECUTE ON FUNCTION search_all(text) TO authenticated;

-- Keep the old image_url column for backward compatibility (will be removed in a future migration)
-- This allows existing code to continue working while we transition to the new structure
