
import React from 'react';
import { Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface RequestItemProps {
  requestId: string;
  pseudo: string;
  avatarUrl: string | null;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
}

export const RequestItem = ({ requestId, pseudo, avatarUrl, onAccept, onRefuse }: RequestItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white/70 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{pseudo[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{pseudo}</span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onAccept(requestId)}
          variant="default"
          className="bg-cyan-500 hover:bg-cyan-600"
          size="sm"
        >
          <Check className="w-4 h-4 mr-1" />
          Accepter
        </Button>
        <Button
          onClick={() => onRefuse(requestId)}
          variant="outline"
          size="sm"
        >
          <X className="w-4 h-4 mr-1" />
          Refuser
        </Button>
      </div>
    </div>
  );
};
