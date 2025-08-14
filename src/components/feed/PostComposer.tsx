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

interface PostComposerProps {
  userId: string;
}

interface MediaFile {
  file: File;
  type: 'image' | 'video';
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

  const uploadMedia = async (files: MediaFile[]): Promise<{ images: string[], videos: string[] }> => {
    const images: string[] = [];
    const videos: string[] = [];

    for (const mediaFile of files) {
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${mediaFile.file.name}`;
      
      if (mediaFile.type === 'image') {
        const { error } = await supabase.storage
          .from("post-images")
          .upload(path, mediaFile.file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        images.push(data.publicUrl);
      } else {
        const { error } = await supabase.storage
          .from("post-videos")
          .upload(path, mediaFile.file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("post-videos").getPublicUrl(path);
        videos.push(data.publicUrl);
      }
    }

    return { images, videos };
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim() && mediaFiles.length === 0) {
        throw new Error("Write something or add media to post.");
      }

      let image_urls: string[] = [];
      let video_urls: string[] = [];
      
      if (mediaFiles.length > 0) {
        const { images, videos } = await uploadMedia(mediaFiles);
        image_urls = images;
        video_urls = videos;
      }

      const { error } = await (supabase as any)
        .from("posts")
        .insert({ 
          user_id: userId, 
          content: content.trim(), 
          image_urls: image_urls,
          video_urls: video_urls
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
        type: file.type.startsWith('image/') ? 'image' : 'video',
        preview: URL.createObjectURL(file)
      }));

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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Selected post media preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMediaFiles([])}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
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
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*,video/*"
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
              Add media ({mediaFiles.length}/10)
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
