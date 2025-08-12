# GitHub OAuth Setup Guide

This guide will help you configure GitHub OAuth login for your DuskWatch Login Hub application.

## Prerequisites

- A GitHub account
- Access to your Supabase project dashboard
- Your application running locally or deployed

## Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:

   **Application name**: `DuskWatch Login Hub` (or your preferred name)
   
   **Homepage URL**: 
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
   
   **Authorization callback URL**: 
   - For development: `https://jyfdccbnjahyaokmhphk.supabase.co/auth/v1/callback`
   - For production: `https://jyfdccbnjahyaokmhphk.supabase.co/auth/v1/callback`

4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** (you'll need these for the next step)

## Step 2: Configure Supabase OAuth Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`jyfdccbnjahyaokmhphk`)
3. Navigate to **Authentication** → **Providers**
4. Find **GitHub** in the list and click on it
5. Enable GitHub authentication by toggling the switch
6. Enter the **Client ID** and **Client Secret** from your GitHub OAuth app
7. Save the settings

## Step 3: Apply Database Migrations

Run the following SQL commands in your Supabase SQL Editor to ensure proper profile creation for OAuth users:

```sql
-- Enhanced OAuth profile handling
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
```

## Step 4: Test the GitHub Login

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click the "Continue with GitHub" button
4. You should be redirected to GitHub for authorization
5. After authorizing, you should be redirected back to your application
6. Check that a profile was created in your Supabase database

## Troubleshooting

### Common Issues

1. **"Provider not configured" error**
   - Ensure GitHub OAuth is enabled in Supabase
   - Verify Client ID and Client Secret are correct
   - Check that the callback URL matches exactly

2. **"Invalid redirect URI" error**
   - Ensure your GitHub OAuth app's callback URL matches: `https://jyfdccbnjahyaokmhphk.supabase.co/auth/v1/callback`
   - The URL must match exactly (no trailing slashes)

3. **Profile not created after OAuth login**
   - Run the database migration SQL above
   - Check the Supabase logs for any errors
   - Verify the `handle_new_user` trigger exists

4. **Username conflicts**
   - The enhanced function automatically handles username conflicts by appending random numbers

### Debugging Steps

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Try the GitHub login
4. Look for any error messages
5. Check the Network tab for failed requests

### Expected Console Output
```
Starting OAuth login with GitHub...
Redirecting to GitHub...
```

## Production Deployment

When deploying to production:

1. Update your GitHub OAuth app's Homepage URL to your production domain
2. The callback URL can remain the same (Supabase handles it)
3. Update any hardcoded localhost URLs in your application
4. Test the OAuth flow in production

## Security Notes

- Never commit your GitHub Client Secret to version control
- Use environment variables for sensitive configuration in production
- Regularly rotate your OAuth app credentials
- Monitor your Supabase logs for any suspicious activity

## GitHub OAuth Scopes

GitHub OAuth provides access to:
- **User profile**: Username, name, email, avatar
- **Public repositories**: If you request additional scopes
- **Email addresses**: Primary and additional emails

The current implementation uses the default scopes which provide basic profile information.

## Additional OAuth Providers

The same setup process applies to other OAuth providers (LinkedIn, Google, Facebook). Just replace the provider-specific configuration in the Supabase dashboard.

For more information, see the [Supabase Auth documentation](https://supabase.com/docs/guides/auth/social-login/auth-github).
