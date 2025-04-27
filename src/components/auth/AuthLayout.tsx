
import React from 'react';
import ShaderBackground from '../ShaderBackground';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
      <ShaderBackground />
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
