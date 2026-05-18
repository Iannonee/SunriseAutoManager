import { Car, ShoppingCart, TrendingUp, Clock, MessageSquare, Ban, BarChart3, Megaphone, MessageCircle, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { isAdmin } from '../../types';

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
  label: string;
  items: NavItem[];
}

export default function Sidebar({ currentPage, onNavigate, role, mobile, onClose }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    veicoli: true,
    operativo: true,
    amministrazione: true,
    admin: true,
  });

  function toggle(group: string) {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }

  const groups: { key: string; label: string; items: NavItem[]; show: boolean }[] = [
    {
      key: 'veicoli',
      label: 'Veicoli',
      show: true,
      items: [
        { id: 'inventario', label: 'Inventario', icon: <Car className="w-4 h-4" /> },
        { id: 'auto-acquistate', label: 'Auto Acquistate', icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'veicoli-venduti', label: 'Veicoli Venduti', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      key: 'operativo',
      label: 'Operativo',
      show: true,
      items: [
        { id: 'turni', label: 'Turni', icon: <Clock className="w-4 h-4" /> },
        { id: 'comunicazioni', label: 'Comunicazioni', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'blacklist', label: 'Blacklist Clienti', icon: <Ban className="w-4 h-4" /> },
        { id: 'comunicazioni-staff', label: 'Comunicazioni Staff', icon: <Megaphone className="w-4 h-4" /> },
      ],
    },
    {
      key: 'amministrazione',
      label: 'Amministrazione',
      show: isAdmin(role),
      items: [
        { id: 'bilancio', label: 'Bilancio', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'chat-admin', label: 'Chat Amministrazione', icon: <MessageCircle className="w-4 h-4" /> },
      ],
    },
    {
      key: 'admin',
      label: 'Pannello Admin',
      show: isAdmin(role),
      items: [
        { id: 'admin-panel', label: 'Gestione Utenti', icon: <Users className="w-4 h-4" /> },
      ],
    },
  ];

  function handleNav(page: Page) {
    onNavigate(page);
    if (mobile && onClose) onClose();
  }

  return (
    <div
      className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}
      style={{ backgroundColor: '#0f0f0f', borderRight: '1px solid #1f1f1f' }}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {groups.filter(g => g.show).map(group => (
          <div key={group.key} className="mb-2">
            <button
              onClick={() => toggle(group.key)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-400 transition-colors"
            >
              <span>{group.label}</span>
              {openGroups[group.key] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups[group.key] && (
              <div className="space-y-0.5 mt-1">
                {group.items.map(item => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'text-black'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={active ? { backgroundColor: '#e8a020' } : {}}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { Page };
