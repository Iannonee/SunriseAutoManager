import { Car, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fullName } from '../../types';

interface NavbarProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export default function Navbar({ onMenuToggle, menuOpen }: NavbarProps) {
  const { profile, signOut } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-16 shrink-0 z-20"
      style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid #1f1f1f' }}
    >
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#e8a020' }}>
            <Car className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">Sunrise Auto</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{fullName(profile)}</p>
            <p className="text-xs" style={{ color: '#e8a020' }}>{profile.role}</p>
          </div>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black"
          style={{ backgroundColor: '#e8a020' }}
        >
          {profile ? profile.nome.charAt(0).toUpperCase() : '?'}
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          title="Esci"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
