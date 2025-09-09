import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import OnlineUsers from './OnlineUsers';
import ChatWindow from './ChatWindow';
import { useMessages } from '@/hooks/useMessages';

interface MessagingInterfaceProps {
  user: User;
}

interface ActiveChat {
  conversationId: string;
  userName: string;
  otherUserId: string;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({ user }) => {
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const { startConversation } = useMessages(user.id);

  const handleStartChat = async (userId: string, userName: string) => {
    // Check if chat is already open
    const existingChat = activeChats.find(chat => chat.otherUserId === userId);
    if (existingChat) return;

    const conversationId = await startConversation(userId);
    if (conversationId) {
      setActiveChats(prev => [...prev, {
        conversationId,
        userName: userName,
        otherUserId: userId
      }]);
    }
  };

  const handleCloseChat = (conversationId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.conversationId !== conversationId));
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-end gap-4 z-50">
      {/* Active Chat Windows */}
      {activeChats.map((chat) => (
        <ChatWindow
          key={chat.conversationId}
          currentUserId={user.id}
          conversationId={chat.conversationId}
          userName={chat.userName}
          onClose={() => handleCloseChat(chat.conversationId)}
        />
      ))}
      
      {/* Online Users List */}
      <OnlineUsers
        currentUserId={user.id}
        onStartChat={handleStartChat}
      />
    </div>
  );
};

export default MessagingInterface;