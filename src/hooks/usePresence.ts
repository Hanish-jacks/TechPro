import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
}

export const usePresence = (userId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    let presenceTimer: NodeJS.Timeout;

    // Set user as online when they connect
    const setOnline = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: 'online',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    };

    // Update presence every 30 seconds
    const updatePresence = () => {
      setOnline();
      presenceTimer = setTimeout(updatePresence, 30000);
    };

    setOnline();
    updatePresence();

    // Set user as offline when they leave
    const setOffline = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: 'offline',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error setting offline status:', error);
      }
    };

    // Listen for presence updates
    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          console.log('Presence update:', payload);
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select(`
            user_id,
            status,
            last_seen,
            profiles!inner(full_name)
          `)
          .eq('status', 'online');

        if (error) throw error;
        setOnlineUsers(data as any);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();

    // Cleanup
    window.addEventListener('beforeunload', setOffline);
    
    return () => {
      clearTimeout(presenceTimer);
      setOffline();
      window.removeEventListener('beforeunload', setOffline);
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  return { onlineUsers };
};