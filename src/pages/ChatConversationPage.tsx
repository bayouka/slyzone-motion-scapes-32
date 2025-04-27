
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ChatConversationPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  
  return (
    <div className="flex flex-col min-h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <Link to="/chat" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold">Conversation #{chatId}</h1>
      </div>
      
      {/* Chat Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          <div className="self-start max-w-[70%] bg-gray-100 rounded-lg p-3">
            <p>Salut ! Comment ça va ?</p>
          </div>
          <div className="self-end max-w-[70%] bg-cyan-500 text-white rounded-lg p-3">
            <p>Très bien et toi ?</p>
          </div>
        </div>
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Écrire un message..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-md">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
