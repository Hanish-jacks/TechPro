import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, UserPlus, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Connections() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchConnections(session.user.id);
        fetchRequests(session.user.id);
        fetchSuggestions(session.user.id);
      }
      setLoading(false);
    });
  }, []);

  const fetchConnections = async (userId: string) => {
    const { data } = await supabase
      .from("user_connections")
      .select(`
        id,
        requester_id,
        addressee_id,
        created_at,
        requester:profiles!user_connections_requester_id_fkey(*),
        addressee:profiles!user_connections_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    const formattedConnections = (data || []).map((conn: any) => {
      const isRequester = conn.requester_id === userId;
      return {
        id: conn.id,
        profile: isRequester ? conn.addressee : conn.requester,
        connectedAt: conn.created_at
      };
    });

    setConnections(formattedConnections);
  };

  const fetchRequests = async (userId: string) => {
    const { data } = await supabase
      .from("user_connections")
      .select(`
        id,
        requester_id,
        created_at,
        requester:profiles!user_connections_requester_id_fkey(*)
      `)
      .eq("addressee_id", userId)
      .eq("status", "pending");

    setRequests(data || []);
  };

  const fetchSuggestions = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .limit(10);

    setSuggestions(data || []);
  };

  const handleAccept = async (connectionId: string, requesterId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);

    if (!error) {
      toast({ title: "Connection accepted!" });
      if (user) {
        fetchRequests(user.id);
        fetchConnections(user.id);
      }
    }
  };

  const handleReject = async (connectionId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .delete()
      .eq("id", connectionId);

    if (!error) {
      toast({ title: "Request declined" });
      if (user) fetchRequests(user.id);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_connections")
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending"
      });

    if (!error) {
      toast({ title: "Connection request sent!" });
      setSuggestions(prev => prev.filter(s => s.id !== targetUserId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Network</h1>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Connections ({connections.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Suggestions
              </TabsTrigger>
            </TabsList>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-4">
              {connections.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-xl">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No connections yet</p>
                  </CardContent>
                </Card>
              ) : (
                connections.map(({ id, profile }) => (
                  <Card key={id} className="bg-card/50 backdrop-blur-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          <UserIcon className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{profile.full_name || "User"}</h3>
                        {profile.headline && (
                          <p className="text-sm text-muted-foreground">{profile.headline}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              {requests.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-xl">
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} className="bg-card/50 backdrop-blur-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={request.requester.avatar_url} />
                        <AvatarFallback>
                          <UserIcon className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {request.requester.full_name || "User"}
                        </h3>
                        {request.requester.headline && (
                          <p className="text-sm text-muted-foreground">
                            {request.requester.headline}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleAccept(request.id, request.requester_id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              {suggestions.map((profile) => (
                <Card key={profile.id} className="bg-card/50 backdrop-blur-xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        <UserIcon className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{profile.full_name || "User"}</h3>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground">{profile.headline}</p>
                      )}
                    </div>
                    <Button onClick={() => handleConnect(profile.id)}>
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}