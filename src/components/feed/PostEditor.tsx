import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Send, Loader2, X, Edit3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageViewer from "@/components/ui/image-viewer";

interface PostEditorProps {
  post: {
    id: string;
    content: string;
    image_url?: string | null;
    image_urls?: string[] | null;
  };
  userId: string;
  onCancel: () => void;
}

export default function PostEditor({ post, userId, onCancel }: PostEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState(post.content);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    post.image_urls || (post.image_url ? [post.image_url] : [])
  );
  const [isNewImage, setIsNewImage] = useState(false);
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

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const uploadPromises = images.map(async (image) => {
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, image, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      return data.publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const updatePost = useMutation({
    mutationFn: async () => {
      if (!content.trim() && files.length === 0 && previews.length === 0) {
        throw new Error("Write something or add an image to post.");
      }

      let image_urls: string[] = [];
      
      // Keep existing images that weren't removed
      const existingImages = previews.filter(preview => 
        !preview.startsWith('blob:') && 
        (post.image_urls?.includes(preview) || post.image_url === preview)
      );
      image_urls.push(...existingImages);
      
      // Upload new files
      if (files.length > 0) {
        const newImageUrls = await uploadImages(files);
        image_urls.push(...newImageUrls);
      }

      const { error } = await (supabase as any)
        .from("posts")
        .update({ 
          content: content.trim(), 
          image_urls: image_urls.length > 0 ? image_urls : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", post.id)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post updated", description: "Your post has been updated successfully." });
      onCancel();
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newFiles = [...files, ...selectedFiles];
      const newPreviews = [...previews, ...selectedFiles.map(file => URL.createObjectURL(file))];
      setFiles(newFiles);
      setPreviews(newPreviews);
      setIsNewImage(true);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setIsNewImage(false);
  };

  const handleCancel = () => {
    // Clean up any created object URLs
    previews.forEach((preview, index) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    onCancel();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previews]);

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Edit3 className="h-4 w-4" />
          Editing post
        </div>
        
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px]"
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Post image preview ${index + 1}`}
                  loading="lazy"
                  className="rounded-md w-full object-cover h-32 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openImageViewer(previews, index)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={previews.length >= 10}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add images ({previews.length}/10)
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updatePost.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updatePost.mutate()}
              disabled={updatePost.isPending}
              className="min-w-28"
            >
              {updatePost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
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
