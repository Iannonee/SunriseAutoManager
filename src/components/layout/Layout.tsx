import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar, { Page } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      <Navbar onMenuToggle={() => setMenuOpen(p => !p)} menuOpen={menuOpen} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/60 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={`fixed top-16 left-0 bottom-0 z-20 w-64 transition-transform duration-200 md:hidden ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            currentPage={currentPage}
            onNavigate={onNavigate}
            role={profile.role}
            mobile
            onClose={() => setMenuOpen(false)}
          />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-col w-64 shrink-0">
          <Sidebar
            currentPage={currentPage}
            onNavigate={onNavigate}
            role={profile.role}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
