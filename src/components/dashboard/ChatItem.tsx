
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatItemProps {
  chatId: string;
  pseudo: string;
  avatarUrl: string | null;
  isUnread: boolean;
  lastMessage?: {
    content: string;
    created_at: string;
  };
}

export const ChatItem = ({
  chatId,
  pseudo,
  avatarUrl,
  isUnread,
  lastMessage
}: ChatItemProps) => {
  // Format the timestamp or use a default
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "À l'instant";
    
    // Here you could implement proper date formatting
    // For now we'll just return a simple format
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message content or default
  const messageContent = lastMessage?.content || "Démarrer la conversation...";
  const timestamp = lastMessage ? formatTimestamp(lastMessage.created_at) : "À l'instant";

  return (
    <Link
      to={`/chat/${chatId}`}
      className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white/70 transition-colors"
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{pseudo[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        {isUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <span className="font-medium">{pseudo}</span>
          <span className="text-sm text-gray-500">{timestamp}</span>
        </div>
        <p className="text-sm text-gray-600 truncate">{messageContent}</p>
      </div>
    </Link>
  );
};
