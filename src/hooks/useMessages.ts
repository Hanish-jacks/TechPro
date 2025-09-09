import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface Conversation {
  id: string;
  type: string;
  name?: string;
  created_at: string;
  other_user_name?: string;
  other_user_id?: string;
}

export const useMessages = (currentUserId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchConversations = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(id, type, name, created_at),
        other_participant:conversation_participants!inner(
          user_id,
          profiles!inner(full_name)
        )
      `)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const formattedConversations = data?.map((item: any) => {
      const otherParticipant = item.other_participant?.find((p: any) => p.user_id !== currentUserId);
      return {
        id: item.conversations.id,
        type: item.conversations.type,
        name: item.conversations.name,
        created_at: item.conversations.created_at,
        other_user_name: otherParticipant?.profiles?.full_name || 'Unknown User',
        other_user_id: otherParticipant?.user_id
      };
    }) || [];

    setConversations(formattedConversations);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (!data || data.length === 0) {
      setMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
      return;
    }

    // Get sender profiles separately
    const senderIds = [...new Set(data.map(msg => msg.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', senderIds);

    const formattedMessages = data.map(msg => {
      const profile = profiles?.find(p => p.id === msg.sender_id);
      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender_name: profile?.full_name || 'Unknown User'
      };
    });

    setMessages(prev => ({
      ...prev,
      [conversationId]: formattedMessages
    }));
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!currentUserId || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!currentUserId) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        other_user_id: otherUserId
      });

      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive"
        });
        return null;
      }

      await fetchConversations();
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    fetchConversations();

    // Listen for new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => ({
            ...prev,
            [newMessage.conversation_id]: [
              ...(prev[newMessage.conversation_id] || []),
              {
                id: newMessage.id,
                conversation_id: newMessage.conversation_id,
                sender_id: newMessage.sender_id,
                content: newMessage.content,
                created_at: newMessage.created_at,
                sender_name: 'Loading...'
              }
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    startConversation,
    fetchConversations
  };
};