
import React from 'react';
import { Search } from 'lucide-react';

const SearchPage = () => {
  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Rechercher un utilisateur</h1>
      
      <div className="w-full max-w-md">
        <div className="relative">
          <input 
            type="text"
            placeholder="Rechercher par pseudo..."
            className="w-full p-3 pl-10 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        
        <div className="mt-8 text-center text-gray-500">
          Entrez un pseudo pour trouver un utilisateur et envoyer une demande de connexion.
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
