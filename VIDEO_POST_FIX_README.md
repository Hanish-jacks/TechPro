# Video Post Fix Guide

## Problem Description
Your video posts are not showing in the feed because:
1. The database schema doesn't have video fields
2. The PostList component isn't handling video posts
3. Large video files (like your 18.84MB file) can't be previewed in Supabase

## Solution Steps

### Step 1: Update Database Schema
Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Add video support to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER,
ADD COLUMN IF NOT EXISTS video_size BIGINT;

-- Add index for video posts
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts(video_url) WHERE video_url IS NOT NULL;

-- Update existing posts that might have video URLs in image_urls
UPDATE posts 
SET video_url = image_url, 
    image_url = NULL 
WHERE image_url LIKE '%.mp4' OR image_url LIKE '%.mov' OR image_url LIKE '%.avi' OR image_url LIKE '%.webm';

-- Verify the changes
SELECT id, content, image_url, image_urls, video_url, video_thumbnail_url 
FROM posts 
LIMIT 10;
```

### Step 2: Code Updates (Already Done)
The following components have been updated:
- ✅ `PostVideo.tsx` - Enhanced with error handling and loading states
- ✅ `PostList.tsx` - Now handles video posts
- ✅ `PostComposer.tsx` - Supports video uploads
- ✅ Database types updated

### Step 3: Test Video Posts
1. **Create a new video post:**
   - Go to your app
   - Select a video file (under 50MB recommended)
   - Post it

2. **Test with sample videos:**
   - Use the `VideoPostTest` component to verify functionality
   - Import it in your main app temporarily

### Step 4: Handle Large Video Files
For videos over 20MB:
- They may not preview in Supabase dashboard (this is normal)
- They will still work in your app
- Consider implementing video compression for better performance

## File Structure
```
src/
├── components/
│   ├── PostVideo.tsx          # Enhanced video player
│   ├── VideoPostTest.tsx      # Test component
│   ├── PostCard.tsx           # Video post support
│   └── feed/
│       ├── PostList.tsx       # Video post rendering
│       └── PostComposer.tsx   # Video upload support
├── integrations/supabase/
│   └── types.ts               # Updated with video fields
└── supabase/
    └── ADD_VIDEO_SUPPORT.sql  # Database migration
```

## Testing
1. Run the SQL migration in Supabase
2. Restart your app
3. Try creating a video post
4. Check if it appears in the feed

## Troubleshooting

### Video Not Showing in Feed
- Check if `video_url` field exists in database
- Verify the PostList component is importing PostVideo
- Check browser console for errors

### Large Video Issues
- Videos over 50MB may have upload issues
- Consider implementing client-side compression
- Use video thumbnails for better performance

### Database Errors
- Ensure all video columns are added
- Check if the migration ran successfully
- Verify table structure in Supabase dashboard

## Next Steps
1. ✅ Run the database migration
2. ✅ Test video post creation
3. ✅ Verify video posts appear in feed
4. 🔄 Consider implementing video compression
5. 🔄 Add video thumbnail generation
6. 🔄 Implement video progress indicators

## Support
If you encounter issues:
1. Check the browser console for errors
2. Verify database schema in Supabase
3. Test with smaller video files first
4. Check network tab for upload issues
