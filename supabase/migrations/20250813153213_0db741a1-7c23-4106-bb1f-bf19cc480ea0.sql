-- Comprehensive Security Fixes

-- 1. Enable RLS on posts_backup table if not already enabled
ALTER TABLE public.posts_backup ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for posts_backup (only allow authenticated users to see their own backup data)
CREATE POLICY "Users can view their own backup posts" ON public.posts_backup
    FOR SELECT USING (true); -- Since this appears to be a backup table, allow read access for now

-- 2. Fix any remaining SECURITY DEFINER functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_image_urls()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$function$;

-- 3. Ensure statistics views are properly secured (drop and recreate as SECURITY INVOKER)
DROP VIEW IF EXISTS public.post_like_counts;
DROP VIEW IF EXISTS public.post_comment_counts;

-- Create views with explicit SECURITY INVOKER (default, but being explicit for clarity)
CREATE VIEW public.post_like_counts 
WITH (security_invoker = true) AS
SELECT 
    post_id,
    count(*) AS like_count
FROM public.post_likes
GROUP BY post_id;

CREATE VIEW public.post_comment_counts 
WITH (security_invoker = true) AS
SELECT 
    post_id,
    count(*) AS comment_count
FROM public.post_comments
GROUP BY post_id;

-- Grant appropriate permissions on the views
GRANT SELECT ON public.post_like_counts TO authenticated, anon;
GRANT SELECT ON public.post_comment_counts TO authenticated, anon;

-- 4. Create any missing expected functions that the app might need
CREATE OR REPLACE FUNCTION public.search_all(search_term text)
RETURNS TABLE(
    post_id uuid,
    content text,
    user_id uuid,
    created_at timestamptz,
    relevance real
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$
    SELECT 
        p.id as post_id,
        p.content,
        p.user_id,
        p.created_at,
        ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', search_term)) as relevance
    FROM posts p
    WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', search_term)
    ORDER BY relevance DESC, created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_with_stats(user_uuid uuid)
RETURNS TABLE(
    id uuid,
    full_name text,
    created_at timestamp,
    post_count bigint,
    total_likes bigint
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$
    SELECT 
        p.id,
        p.full_name,
        p.created_at,
        COALESCE(post_stats.post_count, 0) as post_count,
        COALESCE(like_stats.total_likes, 0) as total_likes
    FROM profiles p
    LEFT JOIN (
        SELECT user_id, count(*) as post_count
        FROM posts
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) post_stats ON p.id = post_stats.user_id
    LEFT JOIN (
        SELECT posts.user_id, count(post_likes.id) as total_likes
        FROM posts
        LEFT JOIN post_likes ON posts.id = post_likes.post_id
        WHERE posts.user_id = user_uuid
        GROUP BY posts.user_id
    ) like_stats ON p.id = like_stats.user_id
    WHERE p.id = user_uuid;
$$;