
export interface RequestData {
  id: string;
  requester: {
    pseudo: string;
    avatar_url: string | null;
  };
}

export interface ChatData {
  id: string;
  otherUser: {
    pseudo: string;
    avatar_url: string | null;
  };
  isUnread: boolean;
}
