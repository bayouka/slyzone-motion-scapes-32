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
  
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResult(null);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  const performSearch = async (value: string) => {
    setIsLoadingSearch(true);

    try {
      const { data: results, error: rpcError } = await supabase
        .rpc('search_profiles_by_pseudo', { search_term: value });

      if (rpcError) throw rpcError;

      if (results && results.length > 0) {
        setSearchResult(results[0]);
      } else {
        setSearchResult(null);
        if (value === searchTerm) {
          toast({
            title: "Aucun utilisateur trouvé",
            description: "Vérifiez l'orthographe du pseudo et réessayez.",
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
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
    
    if (user.id === receiverProfile.profile_id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer de demande à vous-même.",
        variant: "destructive",
      });
      return;
    }
    
    setRequestStatus('sending');
    
    try {
      const { data: existingConnections, error: checkError } = await supabase
        .from('connections')
        .select('id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`requester_id.eq.${receiverProfile.profile_id},receiver_id.eq.${receiverProfile.profile_id}`)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingConnections && existingConnections.length > 0) {
        const status = existingConnections[0].status;
        let message = "Une connexion avec cet utilisateur existe déjà.";
        
        if (status === 'pending') {
          message = "Une demande de connexion est déjà en attente.";
        }
        
        toast({
          title: "Connexion existante",
          description: message,
        });
        
        setRequestStatus('idle');
        return;
      }
      
      const { error: insertError } = await supabase
        .from('connections')
        .insert([{
          requester_id: user.id,
          receiver_id: receiverProfile.profile_id
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
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
        description: "Impossible d'envoyer la demande pour le moment.",
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
