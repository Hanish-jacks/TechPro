-- Enhanced OAuth profile handling
-- This migration updates the handle_new_user function to better handle OAuth users

-- Create function to handle new user signup (enhanced for OAuth)
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
        ELSIF NEW.raw_user_meta_data->>'provider' = 'linkedin_oidc' THEN
            -- Use LinkedIn profile data if available
            username_value := COALESCE(
                NEW.raw_user_meta_data->>'preferred_username',
                NEW.raw_user_meta_data->>'given_name',
                NEW.raw_user_meta_data->>'name',
                'linkedin_user_' || substr(NEW.id::text, 1, 8)
            );
            avatar_url_value := NEW.raw_user_meta_data->>'picture';
            full_name_value := COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'given_name' || ' ' || NEW.raw_user_meta_data->>'family_name',
                username_value
            );
        ELSIF NEW.raw_user_meta_data->>'provider' = 'facebook' THEN
            -- Use Facebook profile data if available
            username_value := COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'first_name',
                'facebook_user_' || substr(NEW.id::text, 1, 8)
            );
            avatar_url_value := NEW.raw_user_meta_data->>'picture';
            full_name_value := COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
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

    INSERT INTO public.profiles (id, username, avatar_url, full_name)
    VALUES (NEW.id, username_value, avatar_url_value, full_name_value);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
