import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/dashboard';
import { RealtimeChannel } from '@supabase/supabase-js';

const MessageBubble: React.FC<{ 
  message: Message; 
  isSentByCurrentUser: boolean;
}> = ({ message, isSentByCurrentUser }) => {
  return (
    <div className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div 
        className={`max-w-[75%] rounded-lg p-3 ${
          isSentByCurrentUser 
            ? 'bg-cyan-500 text-white ml-auto' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <p className="break-words">{message.content}</p>
      </div>
    </div>
  );
};

const ChatConversationPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { data: otherUserInfo } = useQuery({
    queryKey: ['chat-user', chatId, user?.id],
    queryFn: async () => {
      if (!chatId || !user) return null;
      
      const { data, error } = await supabase.rpc('get_accepted_chats', {
        current_user_id: user.id
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const connection = data.find(chat => chat.connection_id === chatId);
      return connection ? {
        id: connection.other_user_id,
        pseudo: connection.other_user_pseudo
      } : null;
    },
    enabled: !!chatId && !!user,
  });

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('connection_id', chatId)
          .order('created_at', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setMessages(data as Message[]);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages",
          variant: "destructive",
        });
      }
    };
    
    fetchMessages();
  }, [chatId, toast]);

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase
      .channel(`chat_messages_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${chatId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === user.id) return;
          
          setMessages(prevMessages => {
            if (prevMessages.some(msg => msg.id === newMessage.id)) return prevMessages;
            return [...prevMessages, newMessage];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !chatId) return;
    
    const newMessage = {
      connection_id: chatId,
      content: message.trim(),
      sender_id: user.id,
    };
    
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, {
      ...newMessage,
      id: tempId,
      created_at: new Date().toISOString(),
    } as Message]);
    
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([newMessage]);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold truncate">
            {otherUserInfo?.pseudo || 'Chargement...'}
          </h1>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={24} />
        </button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Envoyez le premier message !
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isSentByCurrentUser={msg.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex gap-2">
          <input 
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrire un message..."
            className="flex-1 p-3 border border-gray-300 rounded-md"
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            disabled={!message.trim()}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
