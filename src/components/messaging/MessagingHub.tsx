import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OnlineUsers from './OnlineUsers';
import ChatWindow from './ChatWindow';

interface ActiveChat {
  conversationId: string;
  recipientName: string;
  recipientId: string;
}

interface MessagingHubProps {
  currentUserId: string;
}

export default function MessagingHub({ currentUserId }: MessagingHubProps) {
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const { toast } = useToast();

  const startChat = async (recipientId: string, recipientName: string) => {
    // Check if chat is already open
    const existingChat = activeChats.find(chat => chat.recipientId === recipientId);
    if (existingChat) {
      toast({
        title: "Chat already open",
        description: `You already have a chat open with ${recipientName}`,
      });
      return;
    }

    try {
      // Get or create conversation
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        other_user_id: recipientId
      });

      if (error) throw error;

      const newChat: ActiveChat = {
        conversationId: data,
        recipientName,
        recipientId
      };

      setActiveChats(prev => [...prev, newChat]);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive"
      });
    }
  };

  const closeChat = (recipientId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.recipientId !== recipientId));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Online Users Panel */}
      <div className="mb-4">
        <OnlineUsers 
          currentUserId={currentUserId} 
          onStartChat={startChat}
        />
      </div>

      {/* Active Chat Windows */}
      <div className="flex gap-4 flex-wrap justify-end">
        {activeChats.map((chat) => (
          <ChatWindow
            key={chat.recipientId}
            conversationId={chat.conversationId}
            recipientName={chat.recipientName}
            currentUserId={currentUserId}
            onClose={() => closeChat(chat.recipientId)}
          />
        ))}
      </div>
    </div>
  );
}