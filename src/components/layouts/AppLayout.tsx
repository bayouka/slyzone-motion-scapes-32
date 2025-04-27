
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ShaderBackground from '@/components/ShaderBackground';
import Sidebar from '@/components/navigation/Sidebar';
import BottomTabBar from '@/components/navigation/BottomTabBar';

const AppLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in a chat conversation
  const isInChatConversation = location.pathname.match(/^\/chat\/[^/]+$/);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="relative min-h-screen flex w-full bg-gray-50">
      {/* Desktop Sidebar - Hidden in chat conversations */}
      {!isInChatConversation && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      
      {/* Main content */}
      <main className={`flex-1 min-h-screen pb-16 md:pb-0 ${!isInChatConversation ? 'md:ml-64' : ''}`}>
        <ShaderBackground />
        
        <div className="relative z-10 min-h-screen">
          <div className={`${!isInChatConversation ? 'container mx-auto max-w-4xl' : ''} min-h-screen`}>
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Nav - Hidden in chat conversations */}
      {!isInChatConversation && (
        <div className="md:hidden">
          <BottomTabBar />
        </div>
      )}
    </div>
  );
};

export default AppLayout;
