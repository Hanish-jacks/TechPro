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
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  job_title?: string;
  skills?: string[];
  education?: string;
  experience?: string;
  social_links?: any;
  profile_cover_url?: string;
  is_public?: boolean;
  created_at: string;
  updated_at?: string;
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
    queryKey: ["profile", username],
    queryFn: async (): Promise<ProfileData> => {
      let profileData;
      
      if (username === "me") {
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
        // Get profile by username
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (error) throw error;
        profileData = data;
      }

      // Get post count
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profileData.id);

      // Try to get profile with stats (if the function exists)
      try {
        const { data: profileWithStats, error: statsError } = await supabase
          .rpc('get_user_profile_with_stats', { user_id_param: profileData.id });

        if (!statsError && profileWithStats && profileWithStats.length > 0) {
          return profileWithStats[0];
        }
      } catch (error) {
        console.log("Profile stats function not available, using basic profile");
      }

      // Return basic profile with post count
      return {
        ...profileData,
        post_count: postCount || 0,
        follower_count: 0, // Will be implemented later
        following_count: 0, // Will be implemented later
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        company: profileData.company || "",
        job_title: profileData.job_title || "",
        skills: profileData.skills || [],
        education: profileData.education || "",
        experience: profileData.experience || "",
        social_links: profileData.social_links || {},
        profile_cover_url: profileData.profile_cover_url || "",
        is_public: profileData.is_public !== false, // Default to true
        updated_at: profileData.updated_at || profileData.created_at,
      };
    },
    enabled: !!username,
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
  const initials = profile.full_name?.slice(0, 2).toUpperCase() || profile.username.slice(0, 2).toUpperCase();

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
              {profile.profile_cover_url && (
                <img
                  src={profile.profile_cover_url}
                  alt="Profile cover"
                  className="w-full h-full object-cover"
                />
              )}
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Cover
                </Button>
              )}
            </div>

            {/* Profile Info */}
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || profile.username} />
                    ) : (
                      <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          {profile.full_name || profile.username}
                        </h1>
                        <p className="text-muted-foreground mb-2">
                          @{profile.username}
                        </p>
                        {profile.job_title && profile.company && (
                          <p className="text-lg mb-2">
                            {profile.job_title} at {profile.company}
                          </p>
                        )}
                        {profile.location && (
                          <p className="text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-4 w-4" />
                            {profile.location}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isOwnProfile ? (
                          <ProfileEdit 
                            profile={profile} 
                            onClose={() => {
                              // Profile will be refreshed automatically via query invalidation
                            }}
                          />
                        ) : (
                          <Button
                            variant={followStatus ? "outline" : "default"}
                            onClick={() => followMutation.mutate(!followStatus)}
                            disabled={followMutation.isPending}
                          >
                            {followStatus ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
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

                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-muted-foreground mb-4">{profile.bio}</p>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-4">
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                      {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                        <div className="flex items-center gap-2">
                          {Object.entries(profile.social_links).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <Link className="h-4 w-4" />
                            </a>
                          ))}
                        </div>
                      )}
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
                  {profile.education && (
                    <div>
                      <h4 className="font-medium mb-2">Education</h4>
                      <p className="text-sm text-muted-foreground">{profile.education}</p>
                    </div>
                  )}
                  {profile.experience && (
                    <div>
                      <h4 className="font-medium mb-2">Experience</h4>
                      <p className="text-sm text-muted-foreground">{profile.experience}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-2">Member since</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <Card key={post.id} className="bg-card/30 border-border/30">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <Avatar className="h-10 w-10">
                                  {post.profiles.avatar_url ? (
                                    <img src={post.profiles.avatar_url} alt={post.profiles.full_name} />
                                  ) : (
                                    <AvatarFallback>
                                      {post.profiles.full_name?.slice(0, 2).toUpperCase() || post.profiles.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">
                                      {post.profiles.full_name || post.profiles.username}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      @{post.profiles.username}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                              {post.image_url && (
                                <img
                                  src={post.image_url}
                                  alt="Post image"
                                  className="rounded-md w-full object-cover max-h-64"
                                />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No posts yet.</p>
                        {isOwnProfile && (
                          <Button className="mt-2" onClick={() => navigate("/")}>
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
