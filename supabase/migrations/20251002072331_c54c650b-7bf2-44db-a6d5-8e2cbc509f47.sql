-- Fix search_path security warning for update_profiles_updated_at function
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path security warning for get_connection_stats function
CREATE OR REPLACE FUNCTION get_connection_stats(user_uuid UUID)
RETURNS TABLE(connections_count BIGINT, pending_requests_count BIGINT) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;