
import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const Home = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatedBackground />
      
      <div className="content">
        <h1 className="slyzone-title">SLYZONE</h1>
        <p className="slyzone-subtitle">
          Bienvenue dans une expérience numérique immersive
        </p>
        <Link to="/dashboard" className="btn-dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Home;
