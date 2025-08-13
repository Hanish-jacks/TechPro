import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PostComposer from "@/components/feed/PostComposer";
import PostList from "@/components/feed/PostList";
import ChatDrawer from "@/components/chat/ChatDrawer";
import SearchBar from "@/components/search/SearchBar";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // SEO: Title and meta description
  useEffect(() => {
    document.title = "TechPro Feed & Chats | Dashboard";
    const desc = "TechPro social feed: posts, images, and chats dashboard.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;

    // canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-primary/20 rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src="/lovable-uploads/19794bde-56d5-4eb5-9583-17042d97b0af.png" 
                alt="TechPro Logo" 
                className="h-24 w-auto"
              />
              <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TechPro
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              All-in-One Skill-Sharing & Learning Platform
            </p>
          </div>
          
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to TechPro</CardTitle>
              <CardDescription>
                Your all-in-one skill-sharing and learning platform built with cutting-edge technology
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Secure</p>
                  <p className="text-muted-foreground">Enterprise-grade security</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <UserIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">User-Friendly</p>
                  <p className="text-muted-foreground">Intuitive interface</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <div className="h-8 w-8 bg-gradient-primary rounded mx-auto mb-2" />
                  <p className="font-medium">Modern</p>
                  <p className="text-muted-foreground">Latest technology stack</p>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/19794bde-56d5-4eb5-9583-17042d97b0af.png" 
                  alt="TechPro Logo" 
                  className="h-14 w-auto"
                />
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  TechPro Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Welcome back, {user.email}
              </p>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <SearchBar />
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="border-border/50 hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Dashboard Content - Social layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">User ID:</span> {user.id}</p>
                    <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => navigate("/profile/me")}
                  >
                    View My Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>Shortcuts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• My Network</li>
                    <li>• Saved</li>
                    <li>• Groups</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Center feed */}
            <div className="lg:col-span-2 space-y-4">
              <PostComposer userId={user.id} />
              <PostList />
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Real-time messaging coming soon.</p>
                  <p className="text-xs text-muted-foreground">Use the chat button to start a conversation.</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>Who to follow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Product Designers</li>
                    <li>• Frontend Engineers</li>
                    <li>• Data Scientists</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Floating Chat */}
          <ChatDrawer />
        </div>
      </div>
    </div>
  );
};

export default Index;
