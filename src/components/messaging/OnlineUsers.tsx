import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Circle } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';

interface OnlineUsersProps {
  currentUserId: string;
  onStartChat: (userId: string, userName: string) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ currentUserId, onStartChat }) => {
  const { onlineUsers } = usePresence(currentUserId);

  if (onlineUsers.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-green-500 fill-current" />
            Online Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No users online</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-green-500 fill-current" />
          Online Users ({onlineUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.user_id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-green-500 fill-current" />
              <span className="text-sm font-medium">{user.full_name}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartChat(user.user_id, user.full_name || 'Unknown User')}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;