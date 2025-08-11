import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Send, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PostComposerProps {
  userId: string;
}

export default function PostComposer({ userId }: PostComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setContent("");
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (image: File): Promise<string> => {
    const path = `${userId}/${Date.now()}-${image.name}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, image, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim() && !file) {
        throw new Error("Write something or add an image to post.");
      }

      let image_url: string | undefined;
      if (file) {
        image_url = await uploadImage(file);
      }

      const { error } = await (supabase as any)
        .from("posts")
        .insert({ user_id: userId, content: content.trim(), image_url });

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

        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Selected post image preview"
              loading="lazy"
              className="rounded-md w-full object-cover max-h-96"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) setPreview(URL.createObjectURL(f));
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add image
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
    </Card>
  );
}
