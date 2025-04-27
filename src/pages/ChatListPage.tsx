
import React from 'react';
import { Link } from 'react-router-dom';

const ChatListPage = () => {
  // Dummy chat data for placeholder
  const dummyChats = [
    { id: '1', name: 'Alex', lastMessage: 'Salut, ça va ?' },
    { id: '2', name: 'Marie', lastMessage: 'On se voit demain ?' },
    { id: '3', name: 'Thomas', lastMessage: 'Merci pour hier !' }
  ];

  return (
    <div className="flex flex-col min-h-full p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Messages</h1>
      
      <div className="flex flex-col space-y-2">
        {dummyChats.map(chat => (
          <Link 
            key={chat.id}
            to={`/chat/${chat.id}`}
            className="p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white/80 transition-colors"
          >
            <div className="font-medium">{chat.name}</div>
            <div className="text-sm text-gray-500">{chat.lastMessage}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage;
