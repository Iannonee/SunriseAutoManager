import {
  IconCar,
  IconShoppingCart,
  IconTrendingUp,
  IconClock,
  IconMessage,
  IconBan,
  IconChartBar,
  IconSpeakerphone,
  IconMessageDots,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react';
import { isAdmin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { fullName } from '../../types';

type Page =
  | 'inventario'
  | 'auto-acquistate'
  | 'veicoli-venduti'
  | 'turni'
  | 'comunicazioni'
  | 'blacklist'
  | 'bilancio'
  | 'comunicazioni-staff'
  | 'chat-admin'
  | 'admin-panel';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  role: string;
  mobile?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
  show: boolean;
}

export default function Sidebar({ currentPage, onNavigate, role, mobile, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const groups: NavGroup[] = [
    {
      key: 'veicoli',
      label: 'VEICOLI',
      show: true,
      items: [
        { id: 'inventario', label: 'Inventario', icon: <IconCar size={16} /> },
        { id: 'auto-acquistate', label: 'Auto Acquistate', icon: <IconShoppingCart size={16} /> },
        { id: 'veicoli-venduti', label: 'Veicoli Venduti', icon: <IconTrendingUp size={16} /> },
      ],
    },
    {
      key: 'operativo',
      label: 'OPERATIVO',
      show: true,
      items: [
        { id: 'turni', label: 'Turni', icon: <IconClock size={16} /> },
        { id: 'comunicazioni', label: 'Comunicazioni', icon: <IconMessage size={16} /> },
        { id: 'blacklist', label: 'Blacklist Clienti', icon: <IconBan size={16} /> },
        { id: 'comunicazioni-staff', label: 'Comunicazioni Staff', icon: <IconSpeakerphone size={16} /> },
      ],
    },
    {
      key: 'amministrazione',
      label: 'AMMINISTRAZIONE',
      show: isAdmin(role),
      items: [
        { id: 'bilancio', label: 'Bilancio', icon: <IconChartBar size={16} /> },
        { id: 'chat-admin', label: 'Chat Amministrazione', icon: <IconMessageDots size={16} /> },
        { id: 'admin-panel', label: 'Gestione Utenti', icon: <IconUsers size={16} /> },
      ],
    },
  ];

  function handleNav(page: Page) {
    onNavigate(page);
    if (mobile && onClose) onClose();
  }

  const initials = profile
    ? `${profile.nome?.charAt(0) ?? ''}${profile.cognome?.charAt(0) ?? ''}`.toUpperCase()
    : '?';

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '220px',
        backgroundColor: '#0f0f0f',
        borderRight: '0.5px solid #1e1e1e',
      }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div style={{ fontSize: '18px', fontWeight: 500, color: '#e8a020' }}>Sunrise Auto</div>
        <div style={{ fontSize: '11px', color: '#555555', letterSpacing: '1px', marginTop: '2px' }}>
          Gestionale
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3">
        {groups.filter(g => g.show).map(group => (
          <div key={group.key} style={{ marginTop: '20px' }}>
            <div
              style={{
                fontSize: '10px',
                color: '#555555',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '0 8px',
                marginBottom: '6px',
              }}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
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
                      color: active ? '#e8a020' : '#888888',
                      backgroundColor: active ? '#e8a02015' : 'transparent',
                      borderLeft: active ? '2px solid #e8a020' : '2px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff08';
                        (e.currentTarget as HTMLButtonElement).style.color = '#cccccc';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = '#888888';
                      }
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '0.5px solid #1e1e1e' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#e8a02015',
              border: '0.5px solid #e8a02033',
              fontSize: '12px',
              color: '#e8a020',
              fontWeight: 500,
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="truncate"
              style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}
            >
              {profile ? fullName(profile) : '—'}
            </div>
            <div
              className="truncate"
              style={{ fontSize: '11px', color: '#555555' }}
            >
              {profile?.role || '—'}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: '#555555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
            title="Esci"
          >
            <IconLogout size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Page };
