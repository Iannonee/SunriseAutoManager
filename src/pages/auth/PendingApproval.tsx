import { useAuth } from '../../contexts/AuthContext';
import { IconCar, IconClock } from '@tabler/icons-react';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <IconCar size={40} style={{ color: '#e8a020' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#e8a020', marginBottom: '6px' }}>
            Sunrise Auto
          </div>
          <div style={{ fontSize: '13px', color: '#555555' }}>Gestionale interno</div>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#0f0f0f',
            border: '0.5px solid #1e1e1e',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-4"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(232,160,32,0.1)',
              border: '0.5px solid rgba(232,160,32,0.2)',
            }}
          >
            <IconClock size={24} style={{ color: '#e8a020' }} />
          </div>

          <div style={{ fontSize: '16px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>
            Accesso in attesa di approvazione
          </div>
          <div style={{ fontSize: '13px', color: '#888888', marginBottom: '20px', lineHeight: '1.6' }}>
            Il tuo account è stato registrato con successo. Un amministratore deve assegnarti un ruolo prima che tu possa accedere all'applicazione.
          </div>

          {profile?.discord_username && (
            <div style={{ fontSize: '12px', color: '#555555', marginBottom: '20px' }}>
              Account Discord:{' '}
              <span style={{ color: '#888888' }}>{profile.discord_username}</span>
            </div>
          )}

          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#e8a020',
              color: '#000000',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
