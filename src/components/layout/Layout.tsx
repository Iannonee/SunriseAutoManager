import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar, { Page } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  pageTitle?: string;
}

export default function Layout({ currentPage, onNavigate, children, pageTitle }: LayoutProps) {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar — overlaps */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-20 transition-transform duration-200 md:hidden ${
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

      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          role={profile.role}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          onMenuToggle={() => setMenuOpen(p => !p)}
          menuOpen={menuOpen}
          title={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
