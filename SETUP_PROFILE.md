# Profile Setup Guide

## Issue: Profile Not Found

The "Profile Not Found" error occurs because the enhanced profile fields haven't been added to your database yet. Here's how to fix it:

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy and paste the entire content from this file:
     ```
     supabase/migrations/20250115000001_enhance_profiles_table.sql
     ```
   - Click "Run" to execute the migration

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd duskwatch-login-hub

# Apply the migration
supabase db push
```

## Step 2: Verify Migration

After running the migration, you should see:

1. **New columns added** to the `profiles` table:
   - `bio`
   - `location`
   - `website`
   - `company`
   - `job_title`
   - `skills`
   - `education`
   - `experience`
   - `social_links`
   - `profile_cover_url`
   - `is_public`
   - `updated_at`

2. **New table created**:
   - `user_follows` table for follow functionality

3. **New function created**:
   - `get_user_profile_with_stats` function

## Step 3: Test the Profile

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to your profile**:
   - Go to `/profile/me` to view your own profile
   - Or go to `/profile/your-username` to view your profile by username

3. **Test profile editing**:
   - Click "Edit Profile" on your own profile
   - Try adding some information
   - Save the changes

## Troubleshooting

### If you still see "Profile Not Found":

1. **Check if the migration ran successfully**:
   - Go to Supabase Dashboard → Database → Tables
   - Look for the `profiles` table
   - Check if the new columns are present

2. **Check your username**:
   - Make sure you're using the correct username in the URL
   - Try `/profile/me` first to see your own profile

3. **Check the browser console**:
   - Open Developer Tools (F12)
   - Look for any error messages in the Console tab

### If the migration fails:

1. **Check for errors**:
   - Look at the error message in Supabase SQL Editor
   - Common issues:
     - Column already exists
     - Permission denied
     - Syntax errors

2. **Manual column addition**:
   If the migration fails, you can add columns manually:

   ```sql
   -- Add basic profile fields
   ALTER TABLE public.profiles 
   ADD COLUMN IF NOT EXISTS bio TEXT,
   ADD COLUMN IF NOT EXISTS location TEXT,
   ADD COLUMN IF NOT EXISTS website TEXT,
   ADD COLUMN IF NOT EXISTS company TEXT,
   ADD COLUMN IF NOT EXISTS job_title TEXT;
   ```

## Current Status

The profile system is designed to work in two modes:

1. **Basic Mode** (current): Works with existing database structure
   - Shows basic profile information
   - Allows editing of available fields
   - Follow system shows "coming soon" message

2. **Enhanced Mode** (after migration): Full LinkedIn-like features
   - All profile fields available
   - Working follow system
   - Skills management
   - Professional information

## Next Steps

After applying the migration:

1. **Test basic functionality**:
   - View your profile
   - Edit your profile
   - Add some information

2. **Test social features**:
   - Try following other users (if any exist)
   - Check follower counts

3. **Customize your profile**:
   - Add your bio
   - Add your skills
   - Add professional information

## Support

If you continue to have issues:

1. **Check the browser console** for error messages
2. **Verify the migration** ran successfully
3. **Try refreshing** the page after applying the migration
4. **Check the network tab** in Developer Tools for failed requests

The profile system should work immediately after applying the database migration!


