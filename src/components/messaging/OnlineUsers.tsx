import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';

interface OnlineUsersProps {
  currentUserId: string;
  onStartChat: (userId: string, userName: string) => void;
}

export default function OnlineUsers({ currentUserId, onStartChat }: OnlineUsersProps) {
  const { onlineUsers } = usePresence(currentUserId);

  const otherUsers = onlineUsers.filter(user => user.user_id !== currentUserId);

  if (otherUsers.length === 0) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Online Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No other users online</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Online Users
          <Badge variant="secondary" className="ml-auto">
            {otherUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {otherUsers.map((user: any) => (
          <div key={user.user_id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.profiles?.full_name ? 
                      user.profiles.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                      'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-background"></div>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {user.profiles?.full_name || 'Anonymous User'}
                </p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartChat(user.user_id, user.profiles?.full_name || 'Anonymous User')}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}