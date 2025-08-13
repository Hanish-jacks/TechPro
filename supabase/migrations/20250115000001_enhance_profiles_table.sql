-- Enhance profiles table with LinkedIn-like fields
-- This migration adds comprehensive profile information for a professional profile page

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS profile_cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for public profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles (is_public) WHERE is_public = true;

-- Create index for skills search
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin ON public.profiles USING gin(skills);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_value TEXT;
    avatar_url_value TEXT;
    full_name_value TEXT;
BEGIN
    -- For OAuth users, try to get username from provider data
    IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
        -- Regular signup with username
        username_value := NEW.raw_user_meta_data->>'username';
        avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
        full_name_value := NEW.raw_user_meta_data->>'full_name';
    ELSE
        -- OAuth user - try to get data from provider
        IF NEW.raw_user_meta_data->>'provider' = 'github' THEN
            -- Use GitHub username if available
            username_value := COALESCE(
                NEW.raw_user_meta_data->>'user_name',
                NEW.raw_user_meta_data->>'name',
                'user_' || substr(NEW.id::text, 1, 8)
            );
            avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
            full_name_value := COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                username_value
            );
        ELSE
            -- Other OAuth providers or fallback
            username_value := COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'full_name',
                'user_' || substr(NEW.id::text, 1, 8)
            );
            avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
            full_name_value := COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                username_value
            );
        END IF;
    END IF;

    -- Ensure username is unique by appending a number if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_value) LOOP
        username_value := username_value || '_' || floor(random() * 1000)::text;
    END LOOP;

    INSERT INTO public.profiles (
        id, 
        username, 
        avatar_url, 
        full_name,
        bio,
        location,
        website,
        company,
        job_title,
        skills,
        education,
        experience,
        social_links,
        is_public
    )
    VALUES (
        NEW.id, 
        username_value, 
        avatar_url_value, 
        full_name_value,
        NULL, -- bio
        NULL, -- location
        NULL, -- website
        NULL, -- company
        NULL, -- job_title
        ARRAY[]::TEXT[], -- skills
        NULL, -- education
        NULL, -- experience
        '{}'::JSONB, -- social_links
        true -- is_public
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles.updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_updated_at();

-- Update RLS policies to allow viewing public profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON public.profiles
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to get user profile with post count
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    company TEXT,
    job_title TEXT,
    skills TEXT[],
    education TEXT,
    experience TEXT,
    social_links JSONB,
    profile_cover_url TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    post_count BIGINT,
    follower_count BIGINT,
    following_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.bio,
        p.location,
        p.website,
        p.company,
        p.job_title,
        p.skills,
        p.education,
        p.experience,
        p.social_links,
        p.profile_cover_url,
        p.is_public,
        p.created_at,
        p.updated_at,
        COALESCE(post_stats.post_count, 0) as post_count,
        COALESCE(follower_stats.follower_count, 0) as follower_count,
        COALESCE(following_stats.following_count, 0) as following_count
    FROM public.profiles p
    LEFT JOIN (
        SELECT user_id, COUNT(*) as post_count
        FROM public.posts
        WHERE user_id = user_id_param
        GROUP BY user_id
    ) post_stats ON p.id = post_stats.user_id
    LEFT JOIN (
        SELECT followed_id, COUNT(*) as follower_count
        FROM public.user_follows
        WHERE followed_id = user_id_param
        GROUP BY followed_id
    ) follower_stats ON p.id = follower_stats.followed_id
    LEFT JOIN (
        SELECT follower_id, COUNT(*) as following_count
        FROM public.user_follows
        WHERE follower_id = user_id_param
        GROUP BY follower_id
    ) following_stats ON p.id = following_stats.follower_id
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_profile_with_stats(UUID) TO authenticated;

-- Create user_follows table for following functionality
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies for user_follows
CREATE POLICY "Users can view follows" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes for user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_id ON public.user_follows (followed_id);


