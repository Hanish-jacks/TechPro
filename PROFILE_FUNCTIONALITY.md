# Profile Functionality

## Overview
A comprehensive LinkedIn-like profile system that allows users to showcase their professional information, posts, and connect with others. The profile page includes detailed user information, posts, and social features.

## Features

### 👤 **Profile Page**
- **Professional Layout**: LinkedIn-style profile design with cover image and avatar
- **Rich Information**: Bio, location, company, job title, skills, education, and experience
- **Social Stats**: Post count, followers, and following counts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📝 **Profile Information**
- **Basic Info**: Full name, username, bio, location, website
- **Professional Details**: Job title, company, education, work experience
- **Skills**: Tag-based skills system with add/remove functionality
- **Social Links**: External website and social media links
- **Privacy Control**: Public/private profile settings

### 🔗 **Social Features**
- **Follow System**: Users can follow/unfollow other profiles
- **Profile Discovery**: Search and browse public profiles
- **Activity Feed**: View user's posts and activity
- **Profile Stats**: Real-time follower and post counts

### ✏️ **Profile Management**
- **Edit Profile**: Comprehensive profile editing interface
- **Real-time Updates**: Changes reflect immediately
- **Form Validation**: Input validation and error handling
- **Image Management**: Avatar and cover image support

## Technical Implementation

### **Database Schema**

#### **Enhanced Profiles Table**
```sql
-- Additional profile fields
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN location TEXT,
ADD COLUMN website TEXT,
ADD COLUMN company TEXT,
ADD COLUMN job_title TEXT,
ADD COLUMN skills TEXT[],
ADD COLUMN education TEXT,
ADD COLUMN experience TEXT,
ADD COLUMN social_links JSONB,
ADD COLUMN profile_cover_url TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### **User Follows Table**
```sql
CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);
```

#### **Profile Stats Function**
```sql
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(user_id_param UUID)
RETURNS TABLE (
    -- Profile fields
    id UUID,
    username TEXT,
    full_name TEXT,
    -- ... other fields
    -- Stats
    post_count BIGINT,
    follower_count BIGINT,
    following_count BIGINT
)
```

### **Frontend Components**

#### **Profile Page** (`src/pages/Profile.tsx`)
- **Route**: `/profile/:username` or `/profile/me`
- **Features**: Profile display, follow/unfollow, post viewing
- **Responsive**: Mobile-friendly design
- **Loading States**: Skeleton loading for better UX

#### **Profile Edit** (`src/components/profile/ProfileEdit.tsx`)
- **Modal Interface**: Dialog-based editing
- **Form Validation**: Input validation and error handling
- **Skills Management**: Add/remove skills with badges
- **Real-time Updates**: Immediate UI updates

### **Key Features**

#### **Profile Display**
- **Cover Image**: Professional header image
- **Avatar**: Large profile picture with fallback
- **Basic Info**: Name, username, job title, company
- **Location**: Geographic information with icon
- **Bio**: Personal description
- **Stats**: Posts, followers, following counts
- **Links**: Website and social media links

#### **Content Tabs**
- **Posts Tab**: User's posts with full content
- **Activity Tab**: Future enhancement for activity feed
- **Responsive**: Tabbed interface for organized content

#### **Sidebar Information**
- **About Section**: Education, experience, member since
- **Skills Section**: Tag-based skills display
- **Professional Info**: Job details and background

## Usage

### **Viewing Profiles**
1. **Direct URL**: Navigate to `/profile/username`
2. **Search Results**: Click on profile results from search
3. **Dashboard Link**: Use "View My Profile" button
4. **Profile Discovery**: Browse public profiles

### **Editing Your Profile**
1. **Access Edit**: Click "Edit Profile" on your own profile
2. **Update Information**: Fill in professional details
3. **Add Skills**: Use the skills input with Enter key
4. **Save Changes**: Click "Save Changes" to update

### **Following Users**
1. **Visit Profile**: Navigate to any public profile
2. **Follow Button**: Click "Follow" to connect
3. **Unfollow**: Click "Following" to unfollow
4. **Notifications**: Toast notifications for actions

## Profile Fields

### **Basic Information**
- **Full Name**: Display name for the profile
- **Username**: Unique identifier (@username)
- **Bio**: Personal description and summary
- **Location**: City, country, or region
- **Website**: Personal or professional website

### **Professional Information**
- **Job Title**: Current position or role
- **Company**: Current employer or organization
- **Education**: Academic background and degrees
- **Experience**: Work history and background
- **Skills**: Technical and professional skills

### **Social Features**
- **Followers**: Users following this profile
- **Following**: Users this profile follows
- **Posts**: Content created by the user
- **Social Links**: External social media profiles

## Security & Privacy

### **Row Level Security**
- **Profile Access**: Public profiles visible to all users
- **Private Profiles**: Option to make profiles private
- **Own Profile**: Full access to own profile data
- **Follow System**: Secure follow/unfollow operations

### **Data Protection**
- **Input Validation**: Form validation and sanitization
- **Permission Checks**: Verify user permissions
- **Error Handling**: Graceful error handling
- **Rate Limiting**: Prevent abuse of follow system

## Performance Features

### **Optimization**
- **Database Indexes**: Optimized queries for profile data
- **Caching**: React Query caching for profile data
- **Lazy Loading**: Load content as needed
- **Image Optimization**: Efficient image handling

### **User Experience**
- **Loading States**: Skeleton loading for better UX
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Screen reader friendly

## Future Enhancements

### **Profile Features**
- **Profile Verification**: Verified badge system
- **Profile Analytics**: View profile visit statistics
- **Profile Themes**: Customizable profile appearance
- **Profile Badges**: Achievement and milestone badges

### **Social Features**
- **Profile Recommendations**: Suggested profiles to follow
- **Profile Sharing**: Share profiles on social media
- **Profile Export**: Export profile data
- **Profile Backup**: Automatic profile backups

### **Content Features**
- **Profile Pins**: Pin important posts to profile
- **Profile Highlights**: Featured content sections
- **Profile Stories**: Temporary content sharing
- **Profile Collections**: Curated content collections

### **Professional Features**
- **Resume Builder**: Professional resume generation
- **Portfolio Integration**: Link to external portfolios
- **Certification Display**: Professional certifications
- **Endorsements**: Skill endorsements from connections

## Troubleshooting

### **Common Issues**

#### **Profile Not Loading**
- Check if username exists in database
- Verify RLS policies for profile access
- Check network connectivity
- Review browser console for errors

#### **Edit Profile Not Working**
- Verify user authentication
- Check form validation errors
- Review database permissions
- Test with different browsers

#### **Follow System Issues**
- Check user authentication status
- Verify follow table permissions
- Review unique constraint violations
- Test follow/unfollow operations

#### **Image Upload Problems**
- Check file size and format
- Verify storage bucket permissions
- Review image upload policies
- Test with different image types

## Migration Notes

The profile functionality requires the following migration:
- `20250115000001_enhance_profiles_table.sql`

Run this migration in your Supabase SQL editor to enable the enhanced profile features.

## API Endpoints

### **Profile Data**
- `GET /profile/:username` - Get profile by username
- `GET /profile/me` - Get current user's profile
- `PUT /profile` - Update profile information

### **Follow System**
- `POST /follow/:userId` - Follow a user
- `DELETE /follow/:userId` - Unfollow a user
- `GET /follow/status/:userId` - Check follow status

### **Profile Stats**
- `GET /profile/:userId/stats` - Get profile statistics
- `GET /profile/:userId/posts` - Get user's posts
- `GET /profile/:userId/followers` - Get followers list


