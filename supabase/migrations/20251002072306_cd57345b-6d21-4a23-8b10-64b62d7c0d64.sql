-- Enhanced Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Experience table
CREATE TABLE IF NOT EXISTS public.profile_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  employment_type TEXT, -- Full-time, Part-time, Contract, Internship
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Education table
CREATE TABLE IF NOT EXISTS public.profile_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  grade TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Connections/Follow system
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON public.user_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.user_connections(status);

-- Enable RLS
ALTER TABLE public.profile_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Experience
CREATE POLICY "Anyone can view experience"
  ON public.profile_experience FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own experience"
  ON public.profile_experience FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience"
  ON public.profile_experience FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience"
  ON public.profile_experience FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Education
CREATE POLICY "Anyone can view education"
  ON public.profile_education FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own education"
  ON public.profile_education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education"
  ON public.profile_education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education"
  ON public.profile_education FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Connections
CREATE POLICY "Users can view their connections"
  ON public.user_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests"
  ON public.user_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're part of"
  ON public.user_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own connection requests"
  ON public.user_connections FOR DELETE
  USING (auth.uid() = requester_id);

-- Update profiles RLS to allow public viewing
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger for experience updated_at
DROP TRIGGER IF EXISTS trigger_update_experience_updated_at ON public.profile_experience;
CREATE TRIGGER trigger_update_experience_updated_at
  BEFORE UPDATE ON public.profile_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for education updated_at
DROP TRIGGER IF EXISTS trigger_update_education_updated_at ON public.profile_education;
CREATE TRIGGER trigger_update_education_updated_at
  BEFORE UPDATE ON public.profile_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get connection stats
CREATE OR REPLACE FUNCTION get_connection_stats(user_uuid UUID)
RETURNS TABLE(connections_count BIGINT, pending_requests_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.user_connections 
     WHERE (requester_id = user_uuid OR addressee_id = user_uuid) 
     AND status = 'accepted') as connections_count,
    (SELECT COUNT(*) FROM public.user_connections 
     WHERE addressee_id = user_uuid 
     AND status = 'pending') as pending_requests_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;