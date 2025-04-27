
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SearchForm from '@/components/search/SearchForm';
import SearchResults from '@/components/search/SearchResults';

interface SearchResult {
  profile_id: string;
  profile_pseudo: string;
}

const SearchPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResult(null);
      return;
    }

    setIsLoadingSearch(true);
    setSearchResult(null);

    try {
      const { data: results, error: rpcError } = await supabase
        .rpc('search_profiles_by_pseudo', { search_term: value });

      if (rpcError) throw rpcError;

      if (results && results.length > 0) {
        setSearchResult(results[0]);
      } else {
        toast({
          title: "Aucun utilisateur trouvé",
          description: "Vérifiez l'orthographe du pseudo et réessayez.",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur lors de la recherche",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSendRequest = async (receiverProfile: SearchResult) => {
    if (!user) return;
    
    setRequestStatus('sending');
    
    try {
      const { error: insertError } = await supabase
        .from('connections')
        .insert([{
          requester_id: user.id,
          receiver_id: receiverProfile.profile_id
        }]);

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          toast({
            title: "Demande déjà envoyée",
            description: "Vous avez déjà envoyé une demande à cet utilisateur.",
          });
        } else {
          throw insertError;
        }
        setRequestStatus('error');
        return;
      }

      setRequestStatus('sent');
      toast({
        title: "Demande envoyée !",
        description: `Votre demande a été envoyée à ${receiverProfile.profile_pseudo}.`,
      });
    } catch (error) {
      console.error('Request error:', error);
      toast({
        title: "Erreur lors de l'envoi",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
      setRequestStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Rechercher un utilisateur</h1>
      
      <div className="w-full max-w-md">
        <SearchForm 
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          isLoading={isLoadingSearch}
        />

        {searchResult && (
          <SearchResults
            result={searchResult}
            isCurrentUser={user?.id === searchResult.profile_id}
            onSendRequest={handleSendRequest}
            requestStatus={requestStatus}
          />
        )}
        
        {!searchResult && !isLoadingSearch && searchTerm && (
          <div className="mt-8 text-center text-gray-500">
            Entrez un pseudo pour trouver un utilisateur et envoyer une demande de connexion.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
