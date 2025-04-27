
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatConversationPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [message, setMessage] = useState('');
  
  // TODO: Fetch otherUser data from Supabase
  // const { data: otherUser } = useQuery({
  //   queryKey: ['chat-user', chatId],
  //   queryFn: () => supabase.from('profiles').select('pseudo').eq('id', chatId).single()
  // });
  
  const otherUserPseudo = "Utilisateur"; // Placeholder until we fetch real data
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // TODO: Implement send message to Supabase
    // await supabase.from('messages').insert({
    //   chat_id: chatId,
    //   content: message,
    //   sender_id: currentUser.id
    // });
    
    setMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Header - Fixed at top */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <Link to="/chat" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-semibold">Conversation avec {otherUserPseudo}</h1>
      </div>
      
      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="self-start max-w-[70%] bg-gray-100 rounded-lg p-3">
          <p>Salut ! Comment ça va ?</p>
        </div>
        <div className="self-end max-w-[70%] bg-cyan-500 text-white rounded-lg p-3 ml-auto">
          <p>Très bien et toi ?</p>
        </div>
      </div>
      
      {/* Message Input - Fixed at bottom */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex gap-2">
          <input 
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
