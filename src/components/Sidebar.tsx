import React from 'react';
import { 
  Home as HomeIcon, 
  Search, 
  Library, 
  PlusSquare, 
  Heart, 
  LogOut,
  User as UserIcon,
  Rss
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  user: UserProfile | null;
  onNavigate: (view: string, id?: string) => void;
  currentView: string;
  onLogout: () => void;
}

export default function Sidebar({ user, onNavigate, currentView, onLogout }: SidebarProps) {
  const NavItem = ({ icon: Icon, label, view, id }: { icon: any, label: string, view: string, id?: string }) => (
    <button
      onClick={() => onNavigate(view, id)}
      className={`flex items-center gap-4 px-4 py-2 w-full text-left transition-colors duration-200 rounded-md
        ${currentView === view ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
    >
      <Icon size={24} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-black h-full flex flex-col p-2 gap-2">
      <div className="bg-zinc-900 rounded-lg p-2">
        <NavItem icon={HomeIcon} label="Inicio" view="home" />
        <NavItem icon={Search} label="Buscar" view="search" />
        <NavItem icon={Rss} label="Feed" view="feed" />
      </div>

      <div className="bg-zinc-900 rounded-lg p-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 text-zinc-400">
          <div className="flex items-center gap-2">
            <Library size={24} />
            <span className="font-semibold">Tu biblioteca</span>
          </div>
          <button className="hover:text-white transition-colors">
            <PlusSquare size={20} />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {user && (
            <NavItem 
              icon={UserIcon} 
              label="Mi Perfil" 
              view="profile" 
              id={user?.uid} 
            />
          )}
          <NavItem icon={Heart} label="Canciones favoritas" view="liked" />
        </div>

        {user && (
          <div className="border-t border-zinc-800 p-2 mt-auto">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                <p className="text-xs text-zinc-400 capitalize">{user.role}</p>
              </div>
              <button 
                onClick={onLogout}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
