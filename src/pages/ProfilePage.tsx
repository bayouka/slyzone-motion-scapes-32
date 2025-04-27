
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const ProfilePage = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 pt-8">
      <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center text-white text-3xl mb-4">
        {user?.user_metadata?.pseudo?.[0].toUpperCase() || '?'}
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {user?.user_metadata?.pseudo || 'Utilisateur'}
      </h1>
      <p className="text-gray-500 mb-6">{user?.email}</p>
      
      <div className="w-full max-w-md bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-sm">
        <h2 className="font-medium text-lg mb-4">Votre profil Sly</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo</label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user?.user_metadata?.pseudo || 'Non défini'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user?.email}
            </div>
          </div>
          
          <div className="pt-4">
            <button className="w-full py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors">
              Modifier mon profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
