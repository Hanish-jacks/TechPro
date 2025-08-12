import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentsSection from "./CommentsSection";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export default function PostList() {
  const queryClient = useQueryClient();
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: posts, error } = await (supabase as any)
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (posts as Post[]) || [];
      const ids = list.map((p) => p.id);

      const [{ data: auth }, { data: likeCounts }, { data: commentCounts }] = await Promise.all([
        supabase.auth.getUser(),
        (supabase as any).from("post_like_counts").select("*").in("post_id", ids),
        (supabase as any).from("post_comment_counts").select("*").in("post_id", ids),
      ]);

      const likeMap = new Map<string, number>((likeCounts || []).map((r: any) => [r.post_id, Number(r.like_count) || 0]));
      const commentMap = new Map<string, number>((commentCounts || []).map((r: any) => [r.post_id, Number(r.comment_count) || 0]));

      let likedSet = new Set<string>();
      const user = auth?.user;
      if (user && ids.length) {
        const { data: likedRows } = await (supabase as any)
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", ids);
        likedSet = new Set((likedRows || []).map((r: any) => r.post_id));
      }

      return list.map((p) => ({
        ...p,
        likeCount: likeMap.get(p.id) || 0,
        commentCount: commentMap.get(p.id) || 0,
        likedByUser: likedSet.has(p.id),
      }));
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error("Please sign in to like posts.");
      if (liked) {
        const { error } = await (supabase as any)
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
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
                <button
                  className={`flex items-center gap-1 hover:text-primary transition-colors ${
                    (post as any).likedByUser ? "text-primary" : ""
                  }`}
                  onClick={() => toggleLike.mutate({ postId: post.id, liked: (post as any).likedByUser })}
                >
                  <Heart className={`h-4 w-4 ${ (post as any).likedByUser ? "fill-current" : "" }`} />
                  <span className="text-xs">{(post as any).likeCount}</span>
                </button>
                <button
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{(post as any).commentCount}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">Share</span>
                </button>
              </div>

              {openCommentsPostId === post.id && (
                <CommentsSection postId={post.id} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
