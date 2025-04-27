
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Search, Link2, UserCircle } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Accueil', path: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', path: '/chat' },
  { icon: Link2, label: 'Hub', path: '/hub' },
  { icon: UserCircle, label: 'Profil', path: '/profile' },
];

const BottomTabBar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 flex justify-around items-center z-20">
      {navItems.slice(0, 2).map((item) => (
        <NavTab key={item.path} {...item} />
      ))}
      
      {/* Center Action Button */}
      <NavLink 
        to="/search" 
        className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center -translate-y-5 shadow-lg text-white"
      >
        <Search size={24} />
        <span className="sr-only">Rechercher</span>
      </NavLink>
      
      {navItems.slice(2).map((item) => (
        <NavTab key={item.path} {...item} />
      ))}
    </nav>
  );
};

interface NavTabProps {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NavTab = ({ icon: Icon, label, path }: NavTabProps) => {
  return (
    <NavLink
      to={path}
      className={({ isActive }) => 
        `flex flex-col items-center px-3 py-1 ${
          isActive ? 'text-cyan-500' : 'text-gray-500'
        }`
      }
    >
      <Icon size={24} />
      {({ isActive }) => (
        isActive && <span className="text-xs mt-0.5">{label}</span>
      )}
    </NavLink>
  );
};

export default BottomTabBar;
