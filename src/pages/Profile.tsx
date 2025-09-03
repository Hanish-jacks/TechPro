import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  MapPin, 
  Globe, 
  Building, 
  Briefcase, 
  Users, 
  UserPlus, 
  UserCheck,
  Calendar,
  Mail,
  Link,
  Settings,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PostList from "@/components/feed/PostList";
import ProfileEdit from "@/components/profile/ProfileEdit";

interface ProfileData {
  id: string;
  full_name: string | null;
  created_at: string | null;
  post_count?: number;
  follower_count?: number;
  following_count?: number;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  // If no username is provided, default to current user's profile
  const profileUsername = username || "me";

  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Get profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", profileUsername],
    queryFn: async (): Promise<ProfileData> => {
      let profileData;
      
      if (profileUsername === "me") {
        // Get current user's profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        profileData = data;
      } else {
        // For now, just redirect to own profile
        throw new Error("User profiles by username not implemented");
      }

      // Get post count
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profileData.id);

      // Try to get profile with stats (if the function exists)
      try {
        const { data: profileWithStats, error: statsError } = await supabase
          .rpc('get_user_profile_with_stats', { user_uuid: profileData.id });

        if (!statsError && profileWithStats && profileWithStats.length > 0) {
          return {
            ...profileData,
            post_count: profileWithStats[0].post_count,
            follower_count: 0,
            following_count: 0,
          };
        }
      } catch (error) {
        console.log("Profile stats function not available, using basic profile");
      }

      // Return basic profile with post count
      return {
        ...profileData,
        post_count: postCount || 0,
        follower_count: 0,
        following_count: 0,
      };
    },
    enabled: !!profileUsername,
  });

  // Check if current user is following this profile (simplified for now)
  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", currentUser?.id, profile?.id],
    queryFn: async () => {
      // For now, return false until the follow system is fully implemented
      return false;
    },
    enabled: !!currentUser?.id && !!profile?.id,
  });

  // Follow/Unfollow mutation (simplified for now)
  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      // For now, just show a toast until the follow system is implemented
      return Promise.resolve();
    },
    onSuccess: (_, shouldFollow) => {
      setIsFollowing(shouldFollow);
      toast({
        title: shouldFollow ? "Following" : "Unfollowed",
        description: `Follow system coming soon!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  // Get user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["user-posts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!inner(username, full_name, avatar_url)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return posts;
    },
    enabled: !!profile?.id,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              {/* Header skeleton */}
              <div className="h-64 bg-muted rounded-lg" />
              <div className="flex items-center gap-4 -mt-16 ml-6">
                <div className="h-32 w-32 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The profile you're looking for doesn't exist or is private.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const initials = profile.full_name?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>

          {/* Profile Header */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card mb-6 overflow-hidden">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
            </div>

            {/* Profile Info */}
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          {profile.full_name || "User"}
                        </h1>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Profile actions will be added later */}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{profile.post_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{profile.follower_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{profile.following_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* About */}
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Member since</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : "Recently"}
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="posts">Posts ({profile.post_count || 0})</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <TabsContent value="posts" className="mt-0">
                    {postsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse space-y-3">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                            <div className="h-32 bg-muted rounded" />
                          </div>
                        ))}
                      </div>
                    ) : userPosts && userPosts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => {
                              // Create a modal or navigate to post detail
                              toast({
                                title: "Post Details",
                                description: post.content.slice(0, 100) + (post.content.length > 100 ? "..." : ""),
                              });
                            }}
                            className="group relative aspect-square bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                          >
                            {post.image_url ? (
                              <img
                                src={post.image_url}
                                alt="Post image"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
                                <p className="text-sm text-center line-clamp-4 text-foreground">
                                  {post.content}
                                </p>
                              </div>
                            )}
                            
                            {/* Overlay with post info */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end">
                              <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <p className="text-xs font-medium">
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                                {post.image_url && (
                                  <p className="text-xs mt-1 line-clamp-2">
                                    {post.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-muted-foreground rounded-sm" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                        <p className="text-muted-foreground mb-4">
                          {isOwnProfile ? "Share your first post with the community!" : "This user hasn't shared any posts yet."}
                        </p>
                        {isOwnProfile && (
                          <Button onClick={() => navigate("/")}>
                            Create your first post
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="activity" className="mt-0">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Activity feed coming soon.</p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
