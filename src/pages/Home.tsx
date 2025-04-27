
import React from 'react';
import { Link } from 'react-router-dom';
import ShaderBackground from '../components/ShaderBackground';
import { Button } from '@/components/ui/button';

const Home = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ShaderBackground />
      
      <div className="content">
        <h1 className="slyzone-title">SLYZONE</h1>
        <p className="slyzone-subtitle">
          Bienvenue dans une expérience numérique immersive
        </p>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
              Se connecter
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
              S'inscrire
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
