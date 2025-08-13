import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Share2, MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentsSection from "./CommentsSection";
import PostEditor from "./PostEditor";
import ImageViewer from "@/components/ui/image-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function PostList() {
  const queryClient = useQueryClient();
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });
  const { toast } = useToast();

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

      return {
        posts: list.map((p) => ({
          ...p,
          likeCount: likeMap.get(p.id) || 0,
          commentCount: commentMap.get(p.id) || 0,
          likedByUser: likedSet.has(p.id),
        })),
        currentUser: user,
      };
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
      return { postId, liked };
    },
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previous = queryClient.getQueryData<any>(["posts"]);
      queryClient.setQueryData<any>(["posts"], (old) => {
        if (!old || !old.posts) return old;
        return {
          ...old,
          posts: old.posts.map((p: any) => {
            if (p.id !== postId) return p;
            const newLiked = !liked;
            const delta = newLiked ? 1 : -1;
            return { ...p, likedByUser: newLiked, likeCount: Math.max(0, (p.likeCount || 0) + delta) };
          }),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if ((context as any)?.previous) {
        queryClient.setQueryData(["posts"], (context as any).previous);
      }
    },
    onSettled: async (_data, _error, variables) => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId || !variables?.postId) return;
        const [likeCountResp, likedResp] = await Promise.all([
          (supabase as any)
            .from("post_like_counts")
            .select("*")
            .eq("post_id", variables.postId)
            .maybeSingle(),
          (supabase as any)
            .from("post_likes")
            .select("post_id")
            .eq("user_id", userId)
            .eq("post_id", variables.postId),
        ]);
        const likeCount = Number(likeCountResp?.data?.like_count || 0);
        const likedByUser = Array.isArray(likedResp?.data) && likedResp.data.length > 0;
        queryClient.setQueryData<any>(["posts"], (old) => {
          if (!old || !old.posts) return old;
          return {
            ...old,
            posts: old.posts.map((p: any) =>
              p.id === variables.postId ? { ...p, likeCount, likedByUser } : p
            ),
          };
        });
      } catch {
        // no-op: UI already updated optimistically; will reconcile on next refresh
      }
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error("Please sign in to delete posts.");

      // First, get the post to check if it has images
      const { data: post, error: fetchError } = await (supabase as any)
        .from("posts")
        .select("image_url, image_urls")
        .eq("id", postId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the post (this will cascade delete likes and comments)
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // If the post had images, delete them from storage
      const imagesToDelete: string[] = [];
      
      // Add old single image if it exists
      if (post?.image_url) {
        imagesToDelete.push(post.image_url);
      }
      
      // Add multiple images if they exist
      if (post?.image_urls && Array.isArray(post.image_urls)) {
        imagesToDelete.push(...post.image_urls);
      }
      
      if (imagesToDelete.length > 0) {
        try {
          const storagePaths = imagesToDelete.map(imageUrl => {
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            return pathParts.slice(-2).join('/'); // Get the last two parts (userId/filename)
          });
          
          await supabase.storage
            .from("post-images")
            .remove(storagePaths);
        } catch (storageError) {
          // Don't fail the deletion if image removal fails
          console.warn("Failed to delete images from storage:", storageError);
        }
      }

      return postId;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previous = queryClient.getQueryData<any>(["posts"]);
      queryClient.setQueryData<any>(["posts"], (old) => {
        if (!old || !old.posts) return old;
        return {
          ...old,
          posts: old.posts.filter((p: any) => p.id !== postId),
        };
      });
      return { previous };
    },
    onSuccess: () => {
      setDeletePostId(null);
      toast({ title: "Post deleted", description: "Your post has been removed." });
    },
    onError: (err: any, _vars, context) => {
      if ((context as any)?.previous) {
        queryClient.setQueryData(["posts"], (context as any).previous);
      }
      toast({
        title: "Delete failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    },
    onSettled: async (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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

  if (!data || data.posts.length === 0) {
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
      {data.posts.map((post) => {
        const initials = post.user_id.slice(0, 2).toUpperCase();
        const timeAgo = formatDistanceToNow(new Date(post.created_at), {
          addSuffix: true,
        });
        const isEdited = post.updated_at !== post.created_at;
        const isOwner = data.currentUser?.id === post.user_id;
        
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
                    <div className="text-xs text-muted-foreground">
                      {timeAgo}
                      {isEdited && <span className="ml-1">(edited)</span>}
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingPostId(post.id)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletePostId(post.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {editingPostId === post.id ? (
                <PostEditor
                  post={post}
                  userId={data.currentUser?.id || ""}
                  onCancel={() => setEditingPostId(null)}
                />
              ) : (
                <>
                  {post.content && (
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  )}

                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {post.image_urls.slice(0, 3).map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Post image ${index + 1} from TechPro feed`}
                            loading="lazy"
                            className={`rounded-md w-full object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                              post.image_urls!.length === 1 ? 'max-h-96' : 'h-32'
                            }`}
                            onClick={() => openImageViewer(post.image_urls!, index)}
                          />
                          {post.image_urls!.length > 3 && index === 2 && (
                            <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                              <span className="text-white font-semibold">
                                +{post.image_urls!.length - 3} more
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {post.image_url && !post.image_urls && (
                    <img
                      src={post.image_url}
                      alt="Post image from TechPro feed"
                      loading="lazy"
                      className="rounded-md w-full object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageViewer([post.image_url!], 0)}
                    />
                  )}
                </>
              )}

              {editingPostId !== post.id && (
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
              )}

              {openCommentsPostId === post.id && editingPostId !== post.id && (
                <CommentsSection postId={post.id} />
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <ImageViewer
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
      />
      
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deletePost.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
