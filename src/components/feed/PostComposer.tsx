import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Send, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageViewer from "@/components/ui/image-viewer";

interface PostComposerProps {
  userId: string;
}

export default function PostComposer({ userId }: PostComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim() && files.length === 0) {
        throw new Error("Write something or add an image to post.");
      }

      let image_urls: string[] | undefined;
      if (files.length > 0) {
        image_urls = await uploadImages(files);
      }

      const { error } = await (supabase as any)
        .from("posts")
        .insert({ 
          user_id: userId, 
          content: content.trim(), 
          image_urls: image_urls || []
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

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
      <CardContent className="p-4 space-y-3">
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {previews.length > 0 && (
          <div className={`
            ${previews.length === 1 ? 'w-full' : ''}
            ${previews.length === 2 ? 'grid grid-cols-2 gap-2' : ''}
            ${previews.length === 3 ? 'grid grid-cols-2 gap-2' : ''}
            ${previews.length >= 4 ? 'grid grid-cols-2 gap-2' : ''}
          `}>
            {previews.length === 1 && (
              <div className="relative w-full">
                <img
                  src={previews[0]}
                  alt="Selected post image preview"
                  loading="lazy"
                  className="rounded-lg w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openImageViewer(previews, 0)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={() => {
                    setFiles([]);
                    setPreviews([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {previews.length === 2 && previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Selected post image preview ${index + 1}`}
                  loading="lazy"
                  className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openImageViewer(previews, index)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={() => {
                    const newFiles = files.filter((_, i) => i !== index);
                    const newPreviews = previews.filter((_, i) => i !== index);
                    setFiles(newFiles);
                    setPreviews(newPreviews);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {previews.length === 3 && (
              <>
                <div className="relative">
                  <img
                    src={previews[0]}
                    alt="Selected post image preview 1"
                    loading="lazy"
                    className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => openImageViewer(previews, 0)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => {
                      const newFiles = files.filter((_, i) => i !== 0);
                      const newPreviews = previews.filter((_, i) => i !== 0);
                      setFiles(newFiles);
                      setPreviews(newPreviews);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  {[1, 2].map((index) => (
                    <div key={index} className="relative">
                      <img
                        src={previews[index]}
                        alt={`Selected post image preview ${index + 1}`}
                        loading="lazy"
                        className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => openImageViewer(previews, index)}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={() => {
                          const newFiles = files.filter((_, i) => i !== index);
                          const newPreviews = previews.filter((_, i) => i !== index);
                          setFiles(newFiles);
                          setPreviews(newPreviews);
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {previews.length >= 4 && (
              <>
                <div className="relative">
                  <img
                    src={previews[0]}
                    alt="Selected post image preview 1"
                    loading="lazy"
                    className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => openImageViewer(previews, 0)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => {
                      const newFiles = files.filter((_, i) => i !== 0);
                      const newPreviews = previews.filter((_, i) => i !== 0);
                      setFiles(newFiles);
                      setPreviews(newPreviews);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="relative">
                    <img
                      src={previews[1]}
                      alt="Selected post image preview 2"
                      loading="lazy"
                      className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openImageViewer(previews, 1)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0"
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== 1);
                        const newPreviews = previews.filter((_, i) => i !== 1);
                        setFiles(newFiles);
                        setPreviews(newPreviews);
                      }}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                  <div className="relative">
                    <img
                      src={previews[2]}
                      alt="Selected post image preview 3"
                      loading="lazy"
                      className="rounded-lg w-full h-[calc(6rem-0.25rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openImageViewer(previews, 2)}
                    />
                    {previews.length > 4 && (
                      <div 
                        className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                        onClick={() => openImageViewer(previews, 3)}
                      >
                        <span className="text-white font-semibold text-sm">
                          +{previews.length - 3}
                        </span>
                      </div>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white border-0 z-10"
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== 2);
                        const newPreviews = previews.filter((_, i) => i !== 2);
                        setFiles(newFiles);
                        setPreviews(newPreviews);
                      }}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                if (selectedFiles.length > 0) {
                  const newFiles = [...files, ...selectedFiles];
                  const newPreviews = [...previews, ...selectedFiles.map(file => URL.createObjectURL(file))];
                  setFiles(newFiles);
                  setPreviews(newPreviews);
                }
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 10}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add images ({files.length}/10)
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
