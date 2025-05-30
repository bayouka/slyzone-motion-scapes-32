
import React from 'react';
import { Link } from 'react-router-dom';
import ShaderBackground from '../components/ShaderBackground';

const Dashboard = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ShaderBackground />
      
      <div className="content">
        <h1 className="slyzone-title">Dashboard</h1>
        <p className="slyzone-subtitle">
          Votre espace personnel dans le monde numérique
        </p>
        <Link to="/" className="btn-dashboard">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
