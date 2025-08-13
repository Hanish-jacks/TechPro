-- Fix Security Issues

-- 1. Enable RLS on posts_backup table that's missing it
ALTER TABLE public.posts_backup ENABLE ROW LEVEL SECURITY;

-- 2. Drop the count tables and recreate them as proper views instead of SECURITY DEFINER views
DROP TABLE IF EXISTS public.post_like_counts;
DROP TABLE IF EXISTS public.post_comment_counts;

-- Create proper views (these will be SECURITY INVOKER by default, which is safer)
CREATE VIEW public.post_like_counts AS
SELECT 
    post_id,
    count(*) AS like_count
FROM public.post_likes
GROUP BY post_id;

CREATE VIEW public.post_comment_counts AS
SELECT 
    post_id,
    count(*) AS comment_count
FROM public.post_comments
GROUP BY post_id;

-- Grant appropriate permissions on the views
GRANT SELECT ON public.post_like_counts TO authenticated, anon;
GRANT SELECT ON public.post_comment_counts TO authenticated, anon;