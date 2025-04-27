import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RequestItem } from '@/components/dashboard/RequestItem';
import { ChatItem } from '@/components/dashboard/ChatItem';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RequestData, ChatData } from '@/types/dashboard';

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Request states
  const [pendingRequests, setPendingRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat states
  const [acceptedChats, setAcceptedChats] = useState<ChatData[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!user) {
      setIsLoading(false);
      setIsLoadingChats(false);
      return;
    }

    // Load pending requests
    try {
      setIsLoading(true);
      setError(null);

      const { data: requests, error: fetchError } = await supabase
        .from('connections')
        .select(`
          id,
          created_at,
          status,
          requester:profiles!connections_requester_id_fkey (
            id,
            pseudo
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Nous conservons toutes les requêtes, même celles avec requester null
      // La gestion de ces cas particuliers est faite dans le composant RequestItem
      setPendingRequests(requests as RequestData[] || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load connection requests');
      toast({
        title: "Error",
        description: "Failed to load connection requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

    // Load accepted chats
    try {
      setIsLoadingChats(true);
      setErrorChats(null);

      const { data: chats, error: rpcError } = await supabase
        .rpc('get_accepted_chats', { 
          current_user_id: user.id 
        });

      if (rpcError) throw rpcError;

      const formattedChats: ChatData[] = chats.map(chat => ({
        id: chat.connection_id,
        otherUser: {
          pseudo: chat.other_user_pseudo,
          avatar_url: null
        },
        isUnread: false,
        lastMessage: {
          content: "Démarrer la conversation...",
          created_at: chat.last_updated_at
        }
      }));

      setAcceptedChats(formattedChats);
    } catch (err) {
      console.error("Error fetching accepted chats:", err);
      setErrorChats("Impossible de charger vos conversations");
      toast({
        title: "Erreur",
        description: "Impossible de charger vos conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, toast]);

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .match({ id: requestId, receiver_id: user.id, status: 'pending' });

      if (error) throw error;

      // Update UI optimistically
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refresh dashboard data to update the Messages tab
      await loadDashboardData();

      toast({
        title: "Request accepted",
        description: "You can now chat with this user",
      });
    } catch (err) {
      console.error("Error accepting request:", err);
      toast({
        title: "Error",
        description: "Failed to accept the request",
        variant: "destructive",
      });
    }
  };

  const handleRefuse = async (requestId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'refused', 
          updated_at: new Date().toISOString() 
        })
        .match({ id: requestId, receiver_id: user.id, status: 'pending' });

      if (error) throw error;

      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        description: "Request refused",
      });
    } catch (err) {
      console.error("Error refusing request:", err);
      toast({
        title: "Error",
        description: "Failed to refuse the request",
        variant: "destructive",
      });
    }
  };

  const renderRequestsContent = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        </div>
      ));
    }

    if (error) {
      return (
        <div className="text-center py-8 text-gray-500">
          {error}
        </div>
      );
    }

    if (pendingRequests.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucune demande en attente
        </div>
      );
    }

    return pendingRequests.map((request) => (
      <RequestItem
        key={request.id}
        requestId={request.id}
        pseudo={request.requester?.pseudo || "Utilisateur inconnu"}
        avatarUrl={null}
        onAccept={handleAccept}
        onRefuse={handleRefuse}
      />
    ));
  };

  const renderChatsContent = () => {
    if (isLoadingChats) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        </div>
      ));
    }

    if (errorChats) {
      return (
        <div className="text-center py-8 text-gray-500">
          {errorChats}
        </div>
      );
    }

    if (acceptedChats.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Vos conversations apparaîtront ici.
        </div>
      );
    }

    return acceptedChats.map((chat) => (
      <ChatItem
        key={chat.id}
        chatId={chat.id}
        pseudo={chat.otherUser.pseudo}
        avatarUrl={chat.otherUser.avatar_url}
        isUnread={chat.isUnread}
        lastMessage={chat.lastMessage}
      />
    ));
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6 space-y-4">
          {renderRequestsContent()}
        </TabsContent>

        <TabsContent value="messages" className="mt-6 space-y-4">
          {renderChatsContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
