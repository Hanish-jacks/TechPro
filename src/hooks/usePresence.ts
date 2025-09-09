import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnlineUser {
  user_id: string;
  status: string;
  last_seen: string;
  full_name?: string;
}

export const usePresence = (currentUserId: string | undefined) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId) return;

    // Set user as online when they connect
    const setUserOnline = async () => {
      const { error } = await supabase
        .from('user_presence')
        .upsert({ 
          user_id: currentUserId, 
          status: 'online',
          last_seen: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error setting user online:', error);
      }
    };

    // Set user as offline when they disconnect
    const setUserOffline = async () => {
      await supabase
        .from('user_presence')
        .upsert({ 
          user_id: currentUserId, 
          status: 'offline',
          last_seen: new Date().toISOString()
        });
    };

    setUserOnline();

    // Listen for presence changes
    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      // First get online users
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen')
        .neq('user_id', currentUserId)
        .eq('status', 'online');

      if (presenceError) {
        console.error('Error fetching online users:', presenceError);
        return;
      }

      if (!presenceData || presenceData.length === 0) {
        setOnlineUsers([]);
        return;
      }

      // Then get their profiles
      const userIds = presenceData.map(user => user.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      // Combine the data
      const usersWithNames = presenceData.map(user => {
        const profile = profileData?.find(p => p.id === user.user_id);
        return {
          user_id: user.user_id,
          status: user.status,
          last_seen: user.last_seen,
          full_name: profile?.full_name || 'Unknown User'
        };
      });

      setOnlineUsers(usersWithNames);
    };

    fetchOnlineUsers();

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      setUserOnline();
    }, 30000);

    // Set offline when page is hidden or user leaves
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserOffline();
      } else {
        setUserOnline();
      }
    };

    const handleBeforeUnload = () => {
      setUserOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      setUserOffline();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { onlineUsers };
};