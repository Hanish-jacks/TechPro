import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, TrendingUp, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RightSidebarProps {
  userId: string;
}

export default function RightSidebar({ userId }: RightSidebarProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Get users not connected with current user
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", userId)
        .limit(5);
      
      setSuggestedUsers(data || []);
    };

    fetchSuggestions();
  }, [userId]);

  const handleConnect = async (targetUserId: string) => {
    await supabase
      .from("user_connections")
      .insert({
        requester_id: userId,
        addressee_id: targetUserId,
        status: "pending"
      });
    
    // Remove from suggestions
    setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
  };

  return (
    <div className="space-y-4">
      {/* Who to Connect */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            People You May Know
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No suggestions at the moment
            </p>
          ) : (
            suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user.full_name || "User"}
                  </p>
                  {user.headline && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {user.headline}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleConnect(user.id)}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["React Development", "AI & ML", "Web3", "Cloud Computing", "Cybersecurity"].map((topic) => (
            <div key={topic} className="cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors">
              <p className="text-sm font-medium">{topic}</p>
              <p className="text-xs text-muted-foreground">Trending now</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Internship Recommendations */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Recommended Internships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center py-4">
            Coming soon! We'll show personalized internship recommendations here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}