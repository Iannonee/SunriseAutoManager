import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import RpNameForm from './pages/auth/RpNameForm';
import PendingApproval from './pages/auth/PendingApproval';
import Layout from './components/layout/Layout';
import { Page } from './components/layout/Sidebar';
import Inventario from './pages/veicoli/Inventario';
import AutoAcquistate from './pages/veicoli/AutoAcquistate';
import VeicoliVenduti from './pages/veicoli/VeicoliVenduti';
import Turni from './pages/operativo/Turni';
import Comunicazioni from './pages/operativo/Comunicazioni';
import BlacklistClienti from './pages/operativo/BlacklistClienti';
import Bilancio from './pages/amministrazione/Bilancio';
import ComunicazioniStaff from './pages/amministrazione/ComunicazioniStaff';
import ChatAmministrazione from './pages/amministrazione/ChatAmministrazione';
import PannelloAdmin from './pages/admin/PannelloAdmin';
import { isAdmin } from './types';
import { IconX } from '@tabler/icons-react';

const PAGE_TITLES: Record<Page, string> = {
  'inventario': 'Inventario',
  'auto-acquistate': 'Auto Acquistate',
  'veicoli-venduti': 'Veicoli Venduti',
  'turni': 'Turni',
  'comunicazioni': 'Comunicazioni',
  'blacklist': 'Blacklist Clienti',
  'comunicazioni-staff': 'Comunicazioni Staff',
  'bilancio': 'Bilancio',
  'chat-admin': 'Chat Amministrazione',
  'admin-panel': 'Pannello Admin',
};

function DisabledAccount() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center max-w-md px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)' }}
        >
          <IconX size={24} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
          Account disattivato
        </h2>
        <p style={{ fontSize: '14px', color: '#888888', marginBottom: '24px' }}>
          Il tuo account è stato disattivato. Contatta un amministratore.
        </p>
        <button
          onClick={signOut}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#888888',
            border: '0.5px solid #1e1e1e',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Esci
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { authState, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('inventario');

  useEffect(() => {
    if (profile) {
      if ((currentPage === 'bilancio' || currentPage === 'chat-admin') && !isAdmin(profile.role)) {
        setCurrentPage('inventario');
      }
      if (currentPage === 'admin-panel' && !isAdmin(profile.role)) {
        setCurrentPage('inventario');
      }
    }
  }, [profile, currentPage]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: '#e8a020', borderTopColor: 'transparent' }}
          />
          <p style={{ fontSize: '13px', color: '#888888' }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (authState === 'no-profile') {
    return <Login />;
  }

  if (authState === 'needs-rp-name') {
    return <RpNameForm />;
  }

  if (authState === 'needs-role') {
    return <PendingApproval />;
  }

  if (authState === 'disabled') {
    return <DisabledAccount />;
  }

  function handleNavigate(page: Page) {
    if (!profile) return;
    if ((page === 'bilancio' || page === 'chat-admin') && !isAdmin(profile.role)) return;
    if (page === 'admin-panel' && !isAdmin(profile.role)) return;
    setCurrentPage(page);
  }

  function renderPage() {
    switch (currentPage) {
      case 'inventario': return <Inventario />;
      case 'auto-acquistate': return <AutoAcquistate />;
      case 'veicoli-venduti': return <VeicoliVenduti />;
      case 'turni': return <Turni />;
      case 'comunicazioni': return <Comunicazioni />;
      case 'blacklist': return <BlacklistClienti />;
      case 'comunicazioni-staff': return <ComunicazioniStaff />;
      case 'bilancio': return isAdmin(profile?.role) ? <Bilancio /> : <Inventario />;
      case 'chat-admin': return isAdmin(profile?.role) ? <ChatAmministrazione /> : <Inventario />;
      case 'admin-panel': return isAdmin(profile?.role) ? <PannelloAdmin /> : <Inventario />;
      default: return <Inventario />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} pageTitle={PAGE_TITLES[currentPage]}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
