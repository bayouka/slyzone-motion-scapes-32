
export interface RequestData {
  id: string;
  requester: {
    id: string;
    pseudo: string;
    avatar_url?: string | null;
  };
  status: 'pending' | 'accepted' | 'refused' | 'blocked';
  created_at: string;
}

export interface ChatData {
  id: string;
  otherUser: {
    pseudo: string;
    avatar_url: string | null;
  };
  isUnread: boolean;
  lastMessage?: {
    content: string;
    created_at: string;
  };
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  connection_id: string;  // Changed from chat_id to connection_id to match database
  created_at: string;
}
