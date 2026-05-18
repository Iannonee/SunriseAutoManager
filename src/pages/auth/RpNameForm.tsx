import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { IconCar } from '@tabler/icons-react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  backgroundColor: '#0a0a0a',
  border: '0.5px solid #2a2a2a',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 500,
  color: '#555555',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '6px',
};

export default function RpNameForm() {
  const { updateRpName } = useAuth();
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!nome.trim() || !cognome.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    setSaving(true);
    await updateRpName(nome.trim(), cognome.trim());
    setSaving(false);
  }

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
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '8px' }}>
            Primo Accesso
          </div>
          <div style={{ fontSize: '13px', color: '#888888', marginBottom: '24px', lineHeight: '1.6' }}>
            Inserisci il nome e cognome del tuo personaggio RP. Questi dati saranno visibili a tutti nell'applicazione.
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Nome RP <span style={{ color: '#e8a020' }}>*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Mario"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Cognome RP <span style={{ color: '#e8a020' }}>*</span>
                </label>
                <input
                  type="text"
                  value={cognome}
                  onChange={e => setCognome(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Rossi"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#f87171',
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '0.5px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#e8a020',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              {saving ? 'Salvataggio...' : 'Conferma'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
