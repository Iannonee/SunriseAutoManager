import {
  IconUsers, IconCash, IconSword, IconShirt, IconBook, IconLogout, IconArrowsExchange,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { fullName } from '../../types';

type FazionePage = 'membri' | 'finanze' | 'operazioni' | 'outfit' | 'codice';

interface FazioneSidebarProps {
  currentPage: FazionePage;
  onNavigate: (page: FazionePage) => void;
  mobile?: boolean;
  onClose?: () => void;
  onSwitchToSunrise?: () => void;
}

const navItems = [
  { id: 'membri' as FazionePage, label: 'Membri', icon: <IconUsers size={16} /> },
  { id: 'finanze' as FazionePage, label: 'Finanze', icon: <IconCash size={16} /> },
  { id: 'operazioni' as FazionePage, label: 'Operazioni', icon: <IconSword size={16} /> },
  { id: 'outfit' as FazionePage, label: 'Outfit', icon: <IconShirt size={16} /> },
  { id: 'codice' as FazionePage, label: 'Codice', icon: <IconBook size={16} /> },
];

export default function FazioneSidebar({ currentPage, onNavigate, mobile, onClose, onSwitchToSunrise }: FazioneSidebarProps) {
  const { profile, signOut } = useAuth();

  function handleNav(page: FazionePage) {
    onNavigate(page);
    if (mobile && onClose) onClose();
  }

  const initials = profile
    ? `${profile.nome?.charAt(0) ?? ''}${profile.cognome?.charAt(0) ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="flex flex-col h-full" style={{ width: '220px', backgroundColor: '#0f0f0f', borderRight: '0.5px solid #ffffff11' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div style={{ fontSize: '18px', fontWeight: 500, color: '#ffffff' }}>The Four Shadows</div>
        <div style={{ fontSize: '11px', color: '#444444', letterSpacing: '1px', marginTop: '2px' }}>Gestionale</div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3">
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#444444', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 8px', marginBottom: '6px' }}>
            FAZIONE
          </div>
          <div className="space-y-0.5">
            {navItems.map(item => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="flex items-center gap-2.5 w-full transition-all"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: active ? '#ffffff' : '#666666',
                    backgroundColor: active ? '#ffffff15' : 'transparent',
                    borderLeft: active ? '2px solid #ffffff' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff08'; (e.currentTarget as HTMLButtonElement).style.color = '#aaaaaa'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#666666'; } }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Switch to Sunrise */}
      {onSwitchToSunrise && (
        <div className="px-3 pb-2">
          <button
            onClick={onSwitchToSunrise}
            className="w-full flex items-center justify-center gap-2"
            style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e8a02025')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e8a02015')}
          >
            <IconArrowsExchange size={14} />
            <span>Sunrise Auto</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '0.5px solid #ffffff11' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center shrink-0" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff15', border: '0.5px solid #ffffff33', fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>{profile ? fullName(profile) : '—'}</div>
            <div className="truncate" style={{ fontSize: '11px', color: '#444444' }}>{profile?.ruolo_fazione || '—'}</div>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg transition-colors shrink-0" style={{ color: '#444444' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444444')} title="Esci">
            <IconLogout size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { FazionePage };
