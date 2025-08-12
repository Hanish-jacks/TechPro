import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CommentsSectionProps {
  postId: string;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as Comment[]) || [];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to comment.", variant: "destructive" });
        return Promise.reject(new Error("No user"));
      }
      const text = content.trim();
      if (!text) return Promise.reject(new Error("Empty comment"));
      const { error } = await (supabase as any)
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content: text });
      if (error) throw error;
    },
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (err: any) => {
      toast({ title: "Comment failed", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  return (
    <div className="mt-2 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addComment.mutate();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => addComment.mutate()}
          disabled={addComment.isPending}
        >
          {addComment.isPending ? "Posting" : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Comment
            </>
          )}
        </Button>
      </div>

      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-3 space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            data.map((c) => {
              const initials = c.user_id.slice(0, 2).toUpperCase();
              const timeAgo = formatDistanceToNow(new Date(c.created_at), { addSuffix: true });
              return (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">{timeAgo}</div>
                    <div className="whitespace-pre-wrap">{c.content}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground">No comments yet. Be the first!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
