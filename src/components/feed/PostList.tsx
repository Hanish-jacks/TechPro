import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export default function PostList() {
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as Post[]) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-52 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
        <CardContent className="p-8 text-center text-muted-foreground">
          No posts yet. Be the first to share an update!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((post) => {
        const initials = post.user_id.slice(0, 2).toUpperCase();
        const timeAgo = formatDistanceToNow(new Date(post.created_at), {
          addSuffix: true,
        });
        return (
          <Card key={post.id} className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">User</span>
                      <Badge variant="secondary" className="text-xs">TechPro</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{timeAgo}</div>
                  </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>

              {post.content && (
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              )}

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post image from TechPro feed"
                  loading="lazy"
                  className="rounded-md w-full object-cover max-h-96"
                />
              )}

              <div className="flex items-center gap-4 pt-2 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">Like</span>
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">Comment</span>
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">Share</span>
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
