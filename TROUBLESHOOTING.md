# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Error creating account" or similar error messages

**Possible Causes:**
- Database tables not created yet
- Supabase connection issues
- Storage bucket not configured
- Network connectivity issues

**Solutions:**

#### Check Database Tables
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Check Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called "avatars" if it doesn't exist
4. Set it to public
5. Run the following SQL in SQL Editor:

```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to view avatars
CREATE POLICY "Users can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
```

### 2. Avatar upload issues

**Possible Causes:**
- File size too small (must be > 50KB)
- Invalid file type
- Storage bucket not configured

**Solutions:**
- Ensure the image file is larger than 50KB
- Use supported formats: JPEG, PNG, GIF
- Check that the "avatars" storage bucket exists

### 3. Username already taken error

**Solution:**
- Choose a different username
- The system checks for uniqueness across all users

### 4. Email verification issues

**Possible Causes:**
- Email not sent
- Spam folder
- Invalid email address

**Solutions:**
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for email delivery

### 5. Console Errors

**To debug:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to create an account
4. Look for error messages in the console
5. Share the error messages for further assistance

### 6. Network Issues

**Solutions:**
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Try in incognito/private mode

## Testing the Setup

### Quick Test
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to create an account with:
   - Username: testuser123
   - Email: test@example.com
   - Password: testpassword123
   - Avatar: Any image > 50KB
4. Check console for any error messages

### Expected Console Output
```
Starting signup process...
Validating username: testuser123
Creating user account...
User created: [user-id]
Uploading avatar...
Avatar URL: [url or null]
Profile created successfully
```

## Getting Help

If you're still experiencing issues:

1. **Check the console** for error messages
2. **Verify Supabase setup** - ensure tables and storage are configured
3. **Test with a simple account** - use basic credentials
4. **Check network connectivity** - ensure you can reach Supabase
5. **Share error messages** - copy any console errors for troubleshooting

## Common Error Messages

- `"Username is required"` - Enter a username
- `"Avatar image is required"` - Select an image file
- `"File too small"` - Choose an image larger than 50KB
- `"Username is already taken"` - Choose a different username
- `"Invalid email or password"` - Check your credentials
- `"Email not confirmed"` - Check your email for verification link
