import { useState } from 'react';
import FazioneSidebar, { FazionePage } from './FazioneSidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';

interface FazioneLayoutProps {
  currentPage: FazionePage;
  onNavigate: (page: FazionePage) => void;
  children: React.ReactNode;
  pageTitle?: string;
  onSwitchToSunrise?: () => void;
}

export default function FazioneLayout({ currentPage, onNavigate, children, pageTitle, onSwitchToSunrise }: FazioneLayoutProps) {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {menuOpen && (
        <div className="fixed inset-0 z-10 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setMenuOpen(false)} />
      )}
      <div className={`fixed top-0 left-0 bottom-0 z-20 transition-transform duration-200 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <FazioneSidebar currentPage={currentPage} onNavigate={onNavigate} mobile onClose={() => setMenuOpen(false)} onSwitchToSunrise={onSwitchToSunrise} />
      </div>
      <div className="hidden md:flex shrink-0">
        <FazioneSidebar currentPage={currentPage} onNavigate={onNavigate} onSwitchToSunrise={onSwitchToSunrise} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuToggle={() => setMenuOpen(p => !p)} menuOpen={menuOpen} title={pageTitle} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
