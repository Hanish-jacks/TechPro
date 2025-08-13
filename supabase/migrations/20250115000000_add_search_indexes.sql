-- Add search indexes for better performance
-- This migration adds full-text search capabilities to profiles and posts tables

-- Create GIN indexes for full-text search on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username_gin ON public.profiles USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin ON public.profiles USING gin(to_tsvector('english', full_name));

-- Create GIN indexes for full-text search on posts
CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON public.posts USING gin(to_tsvector('english', content));

-- Create trigram indexes for partial matching (ILIKE queries)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON public.profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON public.posts USING gin(content gin_trgm_ops);

-- Add a function to search across multiple tables
CREATE OR REPLACE FUNCTION search_all(query text)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  subtitle text,
  content text,
  image_url text,
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
    p.avatar_url as image_url,
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
    pr.avatar_url as image_url,
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

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_all(text) TO authenticated;

-- Add RLS policy to allow authenticated users to search
CREATE POLICY IF NOT EXISTS "Allow authenticated users to search profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- The posts table already has a policy allowing anyone to view posts
-- so no additional policy is needed for search functionality


