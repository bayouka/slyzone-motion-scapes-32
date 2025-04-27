
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Search, Link2, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: 'Accueil', path: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', path: '/chat' },
  { icon: Search, label: 'Rechercher', path: '/search' },
  { icon: Link2, label: 'Mon Hub', path: '/hub' },
  { icon: UserCircle, label: 'Profil', path: '/profile' },
];

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const userPseudo = user?.user_metadata?.pseudo || 'Utilisateur';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800 flex flex-col z-20">
      {/* Brand Header */}
      <div className="px-6 py-6">
        <h1 className="text-xl">
          <span className="font-semibold text-white">Sly</span>
          <span className="text-gray-300 font-normal">zone</span>
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-gray-600 text-cyan-500 border-l-2 border-cyan-500 pl-[14px]' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto px-4 py-2">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white">
            {userPseudo[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium">{userPseudo}</span>
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
