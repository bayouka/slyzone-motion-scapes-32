import React, { useState } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RequestItem } from '@/components/dashboard/RequestItem';
import { ChatItem } from '@/components/dashboard/ChatItem';
import type { RequestData, ChatData } from '@/types/dashboard';

// Données mockées (à remplacer par les données Supabase)
const mockRequests: RequestData[] = [
  { 
    id: 'req1', 
    requester: { 
      pseudo: 'Alice_Test', 
      avatar_url: null 
    },
    status: 'pending',
    created_at: new Date().toISOString()
  },
  { 
    id: 'req2', 
    requester: { 
      pseudo: 'Bob_Demo', 
      avatar_url: null 
    },
    status: 'pending',
    created_at: new Date().toISOString()
  },
];

const mockChats: ChatData[] = [
  { 
    id: 'chat1', 
    otherUser: { 
      pseudo: 'Charlie_Conv', 
      avatar_url: null 
    }, 
    isUnread: true,
    lastMessage: {
      content: 'Salut, comment ça va ?',
      created_at: new Date().toISOString()
    }
  },
  { 
    id: 'chat2', 
    otherUser: { 
      pseudo: 'Diana_Msg', 
      avatar_url: null 
    }, 
    isUnread: false,
    lastMessage: {
      content: 'On se voit demain ?',
      created_at: new Date().toISOString()
    }
  },
];

const DashboardPage = () => {
  // TODO: Remplacer par de vraies fonctions Supabase
  const handleAcceptRequest = (requestId: string) => {
    console.log('Accepter demande:', requestId);
    // Futur: UPDATE connections SET status = 'accepted' WHERE id = requestId
  };

  const handleRefuseRequest = (requestId: string) => {
    console.log('Refuser demande:', requestId);
    // Futur: UPDATE connections SET status = 'refused' WHERE id = requestId
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
          {mockRequests.length > 0 ? (
            mockRequests.map((request) => (
              <RequestItem
                key={request.id}
                requestId={request.id}
                pseudo={request.requester.pseudo}
                avatarUrl={request.requester.avatar_url}
                onAccept={handleAcceptRequest}
                onRefuse={handleRefuseRequest}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune demande en attente
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-6 space-y-4">
          {mockChats.length > 0 ? (
            mockChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chatId={chat.id}
                pseudo={chat.otherUser.pseudo}
                avatarUrl={chat.otherUser.avatar_url}
                isUnread={chat.isUnread}
                lastMessage={chat.lastMessage}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune conversation active
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
