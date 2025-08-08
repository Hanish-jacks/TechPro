# DuskWatch Login Hub

A modern authentication system built with React, TypeScript, and Supabase, featuring user registration with username and avatar upload functionality.

## Features

### User Registration
- **Username**: Required field (simple text input)
- **Avatar Upload**: Required image upload with size validation (must be > 50KB)
- **Email Verification**: Secure email-based account verification
- **Profile Creation**: Automatic profile creation with avatar storage

### User Authentication
- **Secure Login**: Email and password authentication
- **Session Management**: Persistent sessions with automatic token refresh
- **Protected Routes**: Route protection for authenticated users

### Avatar Management
- **File Validation**: Size and type validation for uploaded images
- **Preview**: Real-time avatar preview during upload
- **Storage**: Secure cloud storage with user-specific folders
- **Public Access**: Public URLs for avatar display

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Routing**: React Router DOM

## Setup Instructions

### 1. Database Setup

Run the following SQL commands in your Supabase SQL editor:

#### Create Profiles Table
```sql
-- Create profiles table with username and avatar_url fields
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

#### Create Storage Bucket
```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to view avatars
CREATE POLICY "Users can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
```

### 2. Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase:
   - Update `src/integrations/supabase/client.ts` with your Supabase URL and anon key
   - Update `supabase/config.toml` with your project ID

### 3. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### User Registration

1. Navigate to the signup page
2. Enter a username (any text)
3. Upload an avatar image (must be > 50KB)
4. Enter email and password
5. Submit the form
6. Check email for verification link

### User Login

1. Navigate to the login page
2. Enter email and password
3. Submit the form
4. Redirected to dashboard upon successful login

## File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx          # Enhanced auth form with username/avatar
│   │   └── ProtectedRoute.tsx    # Route protection component
│   └── ui/                       # shadcn/ui components
├── integrations/
│   └── supabase/
│       ├── client.ts             # Supabase client configuration
│       └── types.ts              # Database types
├── pages/
│   ├── Auth.tsx                  # Authentication page
│   └── Index.tsx                 # Dashboard page
└── hooks/
    └── use-toast.ts              # Toast notifications
```

## Validation Rules

### Username
- Required field
- Must be unique across all users
- Simple text input (no special character restrictions)

### Avatar
- Must be an image file (JPEG, PNG, GIF)
- Minimum file size: 50KB
- Maximum file size: 10MB (configurable)
- Supported formats: image/*

## Security Features

- Row Level Security (RLS) enabled on profiles table
- User-specific storage folders for avatars
- Secure file upload with validation
- Email verification required for account activation
- Protected routes for authenticated users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
