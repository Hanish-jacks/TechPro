import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Video, Send, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageViewer from "@/components/ui/image-viewer";
import ImageGridPreview from "@/components/ui/image-grid-preview";
import { PostVideo } from "@/components/PostVideo";
import { PDFViewer } from "@/components/PDFViewer";

interface PostComposerProps {
  userId: string;
}

interface MediaFile {
  file: File;
  type: 'image' | 'video' | 'pdf';
  preview: string;
}

export default function PostComposer({ userId }: PostComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openImageViewer = (images: string[], initialIndex: number = 0) => {
    setImageViewer({
      isOpen: true,
      images,
      initialIndex,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      images: [],
      initialIndex: 0,
    });
  };

  const resetForm = () => {
    setContent("");
    setMediaFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Function to generate video thumbnail
  const generateVideoThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 0.1 seconds to avoid black frames
        video.currentTime = 0.1;
        
        video.onseeked = () => {
          if (ctx) {
            // Draw the video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const thumbnailUrl = URL.createObjectURL(blob);
                resolve(thumbnailUrl);
              } else {
                // Fallback to video URL if thumbnail generation fails
                resolve(URL.createObjectURL(videoFile));
              }
            }, 'image/jpeg', 0.8);
          } else {
            resolve(URL.createObjectURL(videoFile));
          }
        };
      };
      
      video.onerror = () => {
        // Fallback if video loading fails
        resolve(URL.createObjectURL(videoFile));
      };
      
      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  };

  const uploadMedia = async (files: MediaFile[]): Promise<{ images: string[], videos: string[], thumbnails: string[], pdfs: any[] }> => {
    const images: string[] = [];
    const videos: string[] = [];
    const thumbnails: string[] = [];
    const pdfs: any[] = [];

    for (const mediaFile of files) {
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${mediaFile.file.name}`;
      
      if (mediaFile.type === 'image') {
        const { error } = await supabase.storage
          .from("post-images")
          .upload(path, mediaFile.file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        images.push(data.publicUrl);
      } else if (mediaFile.type === 'pdf') {
        // Upload PDF
        const { error } = await supabase.storage
          .from("post-pdfs")
          .upload(path, mediaFile.file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("post-pdfs").getPublicUrl(path);
        pdfs.push({
          url: data.publicUrl,
          filename: mediaFile.file.name,
          size: mediaFile.file.size,
          // Note: page count would need to be determined client-side or via a separate service
        });
      } else {
        // Upload video
        const { error } = await supabase.storage
          .from("post-videos")
          .upload(path, mediaFile.file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("post-videos").getPublicUrl(path);
        videos.push(data.publicUrl);
        
        // Generate and upload thumbnail
        try {
          const thumbnailBlob = await generateVideoThumbnail(mediaFile.file);
          const thumbnailPath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}-thumb-${mediaFile.file.name.replace(/\.[^/.]+$/, '.jpg')}`;
          
          const { error: thumbError } = await supabase.storage
            .from("post-images")
            .upload(thumbnailPath, thumbnailBlob, { cacheControl: "3600", upsert: false });
          
          if (!thumbError) {
            const { data: thumbData } = supabase.storage.from("post-images").getPublicUrl(thumbnailPath);
            thumbnails.push(thumbData.publicUrl);
          } else {
            thumbnails.push(data.publicUrl); // Fallback to video URL
          }
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
          thumbnails.push(data.publicUrl); // Fallback to video URL
        }
      }
    }

    return { images, videos, thumbnails, pdfs };
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim() && mediaFiles.length === 0) {
        throw new Error("Write something or add media to post.");
      }

      let image_urls: string[] = [];
      let video_url: string | null = null;
      let video_thumbnail_url: string | null = null;
      let pdf_url: string | null = null;
      let pdf_filename: string | null = null;
      let pdf_size: number | null = null;
      
      if (mediaFiles.length > 0) {
        const { images, videos, thumbnails, pdfs } = await uploadMedia(mediaFiles);
        
        // If we have PDFs, prioritize PDF and don't include other media
        if (pdfs.length > 0) {
          pdf_url = pdfs[0].url;
          pdf_filename = pdfs[0].filename;
          pdf_size = pdfs[0].size;
        } else if (videos.length > 0) {
          // If we have videos, prioritize video and don't include images
          video_url = videos[0];
          // Use the generated thumbnail
          video_thumbnail_url = thumbnails[0] || videos[0];
        } else {
          // Only include images if no videos or PDFs
          image_urls = images;
        }
      }

      const { error } = await (supabase as any)
        .from("posts")
        .insert({ 
          user_id: userId, 
          content: content.trim(), 
          image_urls: image_urls.length > 0 ? image_urls : null,
          video_url: video_url,
          video_thumbnail_url: video_thumbnail_url,
          pdf_url: pdf_url,
          pdf_filename: pdf_filename,
          pdf_size: pdf_size
        });

      if (error) throw error;
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Posted", description: "Your update is live." });
    },
    onError: (err: any) => {
      toast({
        title: "Post failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newMediaFiles: MediaFile[] = selectedFiles.map(file => ({
        file,
        type: file.type.startsWith('image/') ? 'image' : 
               file.type === 'application/pdf' ? 'pdf' : 'video',
        preview: URL.createObjectURL(file)
      }));

      // Check if we're trying to mix different media types
      const hasVideos = mediaFiles.some(m => m.type === 'video') || newMediaFiles.some(m => m.type === 'video');
      const hasImages = mediaFiles.some(m => m.type === 'image') || newMediaFiles.some(m => m.type === 'image');
      const hasPDFs = mediaFiles.some(m => m.type === 'pdf') || newMediaFiles.some(m => m.type === 'pdf');
      
      // Only allow one type of media per post
      const mediaTypes = [hasVideos, hasImages, hasPDFs].filter(Boolean);
      if (mediaTypes.length > 1) {
        toast({
          title: "Mixed media not supported",
          description: "Please select only one type of media: images, videos, or PDFs.",
          variant: "destructive",
        });
        return;
      }

      // Check video file size (warn if over 50MB)
      const videoFiles = newMediaFiles.filter(m => m.type === 'video');
      for (const videoFile of videoFiles) {
        if (videoFile.file.size > 50 * 1024 * 1024) { // 50MB
          toast({
            title: "Large video file",
            description: "Videos over 50MB may take longer to upload and may not preview properly.",
            variant: "default",
          });
        }
      }

      const updatedMediaFiles = [...mediaFiles, ...newMediaFiles];
      setMediaFiles(updatedMediaFiles);
    }
  };

  const removeMedia = (index: number) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newMediaFiles);
  };

  const getImages = () => mediaFiles.filter(m => m.type === 'image').map(m => m.preview);
  const getVideos = () => mediaFiles.filter(m => m.type === 'video');
  const getPDFs = () => mediaFiles.filter(m => m.type === 'pdf');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
      <CardContent className="p-4 space-y-3">
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Media Previews */}
        {mediaFiles.length > 0 && (
          <div className="space-y-3">
            {/* Selected Media Info */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {getPDFs().length > 0 
                    ? `📄 PDF Document Ready (${getPDFs().length} file${getPDFs().length > 1 ? 's' : ''})`
                    : getVideos().length > 0 
                    ? `🎥 Video Post (${getVideos().length} video${getVideos().length > 1 ? 's' : ''})`
                    : `🖼️ Image${getImages().length > 1 ? 's' : ''} Selected (${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''})`
                  }
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMediaFiles([])}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Image Previews */}
            {getImages().length > 0 && (
              <ImageGridPreview
                images={getImages()}
                onRemove={(index) => {
                  const imageFiles = mediaFiles.filter(m => m.type === 'image');
                  const actualIndex = mediaFiles.findIndex(m => m === imageFiles[index]);
                  if (actualIndex !== -1) removeMedia(actualIndex);
                }}
                onOpenViewer={(index) => openImageViewer(getImages(), index)}
              />
            )}

            {/* Video Previews */}
            {getVideos().map((videoFile, index) => (
              <div key={index} className="relative">
                <PostVideo
                  videoUrl={videoFile.preview}
                  className="w-full"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Generating thumbnail...
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const videoFiles = mediaFiles.filter(m => m.type === 'video');
                    const actualIndex = mediaFiles.findIndex(m => m === videoFiles[index]);
                    if (actualIndex !== -1) removeMedia(actualIndex);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* PDF Previews */}
            {getPDFs().map((pdfFile, index) => (
              <div key={index} className="relative">
                <div className="relative">
                  <PDFViewer
                    pdfUrl={pdfFile.preview}
                    filename={pdfFile.file.name}
                    fileSize={pdfFile.file.size}
                    className="w-full"
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                    Ready to Post
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const pdfFiles = mediaFiles.filter(m => m.type === 'pdf');
                      const actualIndex = mediaFiles.findIndex(m => m === pdfFiles[index]);
                      if (actualIndex !== -1) removeMedia(actualIndex);
                    }}
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">PDF Ready</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {pdfFile.file.name} ({formatFileSize(pdfFile.file.size)}) will be uploaded when you post.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*,video/*,.pdf,application/pdf"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= 10}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add media/PDF ({mediaFiles.length}/10)
            </Button>
          </div>

          <Button
            onClick={() => createPost.mutate()}
            disabled={createPost.isPending}
            className="min-w-28"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      <ImageViewer
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
      />
    </Card>
  );
}
