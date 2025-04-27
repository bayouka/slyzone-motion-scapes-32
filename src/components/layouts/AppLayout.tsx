
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ShaderBackground from '@/components/ShaderBackground';
import Sidebar from '@/components/navigation/Sidebar';
import BottomTabBar from '@/components/navigation/BottomTabBar';

const AppLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }
  
  // Only render layout when authenticated
  if (!user) return null;

  return (
    <div className="relative min-h-screen flex w-full bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-16 md:pb-0">
        <ShaderBackground />
        
        <div className="relative z-10 min-h-screen">
          <div className="container mx-auto max-w-4xl min-h-screen">
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomTabBar />
      </div>
    </div>
  );
};

export default AppLayout;
