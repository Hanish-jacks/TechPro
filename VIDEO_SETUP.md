# Video Upload Setup Guide

## 1. Create Video Storage Bucket

You need to create a storage bucket for videos in your Supabase project:

### Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Storage → Buckets
3. Click "Create a new bucket"
4. Set bucket name: `post-videos`
5. Set public bucket: `true`
6. Click "Create bucket"

### Via SQL (if you prefer):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-videos', 'post-videos', true);
```

## 2. Set Storage Policies

Create policies for the `post-videos` bucket:

```sql
-- Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated users to upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'post-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow public access to view videos
CREATE POLICY "Allow public access to view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'post-videos');

-- Allow users to delete their own videos
CREATE POLICY "Allow users to delete own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'post-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 3. Update Database Schema (if needed)

If your posts table doesn't have a `video_urls` column, add it:

```sql
-- Add video_urls column to posts table
ALTER TABLE posts 
ADD COLUMN video_urls TEXT[] DEFAULT '{}';

-- If you want to add a single video_url column as well
ALTER TABLE posts 
ADD COLUMN video_url TEXT;
```

## 4. Test Video Upload

1. Restart your development server
2. Try uploading a video file in the PostComposer
3. The video should now show a proper preview using the PostVideo component
4. Check that videos are uploaded to the `post-videos` bucket

## 5. Troubleshooting

### Video not showing preview:
- Check browser console for errors
- Verify the video file type is supported (MP4, WebM, OGV)
- Ensure the PostVideo component is properly imported

### Upload fails:
- Check Supabase storage bucket permissions
- Verify the `post-videos` bucket exists
- Check network tab for upload errors

### Video not playing in modal:
- Ensure the video URL is accessible
- Check browser video format support
- Verify the modal is opening correctly

## 6. Supported Video Formats

The PostVideo component supports:
- **MP4** (H.264) - Most compatible
- **WebM** (VP8/VP9) - Good web support
- **OGV** (Theora) - Limited support

## 7. Performance Considerations

- Videos are only loaded when the modal opens (lazy loading)
- Thumbnails are generated from the video file
- Consider implementing video compression for large files
- Add file size limits if needed (e.g., max 100MB per video)

## 8. Next Steps

After setting up video support:
1. Update PostList to display video posts
2. Add video deletion when posts are removed
3. Implement video compression/optimization
4. Add video analytics tracking
5. Consider implementing video thumbnails generation
