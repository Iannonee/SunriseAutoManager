import { IconMenu2, IconX } from '@tabler/icons-react';

interface NavbarProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
  title?: string;
  children?: React.ReactNode;
}

export default function Navbar({ onMenuToggle, menuOpen, title, children }: NavbarProps) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0 z-20"
      style={{
        backgroundColor: '#0a0a0a',
        borderBottom: '0.5px solid #e8a02033',
        height: '52px',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: '#888888' }}
          onClick={onMenuToggle}
          onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
        >
          {menuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
        </button>

        {title && (
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{title}</span>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
