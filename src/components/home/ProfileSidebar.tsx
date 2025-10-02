import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, MapPin } from "lucide-react";

interface ProfileSidebarProps {
  userId: string;
}

export default function ProfileSidebar({ userId }: ProfileSidebarProps) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      setProfile(data);
    };

    const fetchStats = async () => {
      const { data } = await supabase
        .rpc("get_connection_stats", { user_uuid: userId });
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    };

    fetchProfile();
    fetchStats();
  }, [userId]);

  if (!profile) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50">
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="h-16 bg-gradient-primary rounded-t-lg" />
        
        {/* Avatar */}
        <div className="px-4 -mt-8">
          <Avatar className="h-16 w-16 border-4 border-card">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg">
              {profile.full_name || "User"}
            </h3>
            {profile.headline && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {profile.headline}
              </p>
            )}
          </div>

          {/* Location & Company */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.company && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                <span>{profile.company}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-medium">{stats?.connections_count || 0}</span>
            </div>
            {stats?.pending_requests_count > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-primary">
                  {stats.pending_requests_count}
                </span>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/profile/${userId}`)}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}