
import React from 'react';
import { UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchResultProfile {
  profile_id: string;
  profile_pseudo: string;
}

interface SearchResultsProps {
  result: SearchResultProfile | null;
  isCurrentUser: boolean;
  onSendRequest: (profile: SearchResultProfile) => void;
  requestStatus: 'idle' | 'sending' | 'sent' | 'error';
}

const SearchResults = ({ result, isCurrentUser, onSendRequest, requestStatus }: SearchResultsProps) => {
  if (!result) return null;

  const isRequestSent = requestStatus === 'sent';
  const isSending = requestStatus === 'sending';

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <UserRound className="h-6 w-6 text-cyan-600" />
            </div>
            <span className="text-lg font-medium">{result.profile_pseudo}</span>
          </div>
          
          {isCurrentUser ? (
            <span className="text-sm text-muted-foreground">C'est vous !</span>
          ) : (
            <Button 
              onClick={() => onSendRequest(result)}
              disabled={isSending || isRequestSent}
            >
              {isRequestSent ? 'Demande envoyée' : isSending ? 'Envoi...' : 'Envoyer une demande'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResults;
