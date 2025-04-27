
import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
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
  // Détermine s'il y a une erreur avec le profil demandeur
  const hasProfileError = pseudo === "Utilisateur inconnu";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white/70 transition-colors gap-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className={hasProfileError ? "bg-red-100 text-red-600" : ""}>
            {hasProfileError ? <AlertCircle size={16} /> : pseudo[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <span className="font-medium">{pseudo}</span>
          {hasProfileError && (
            <p className="text-xs text-red-500 mt-1">
              Profil demandeur introuvable
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          onClick={() => onAccept(requestId)}
          variant="default"
          className="flex-1 sm:flex-initial bg-cyan-500 hover:bg-cyan-600"
          size="sm"
          disabled={hasProfileError}
        >
          <Check className="w-4 h-4 mr-1" />
          Accepter
        </Button>
        <Button
          onClick={() => onRefuse(requestId)}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial"
        >
          <X className="w-4 h-4 mr-1" />
          Refuser
        </Button>
      </div>
    </div>
  );
};
