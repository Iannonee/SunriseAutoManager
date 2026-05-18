import { useEffect, useState } from 'react';
import { IconPencil, IconUserOff, IconUserCheck } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { Profile, UserRole, ROLES, fullName, isAdmin } from '../../types';
import Modal from '../../components/ui/Modal';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 500,
  color: '#555555',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  backgroundColor: '#0a0a0a',
  border: '0.5px solid #2a2a2a',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: '10px',
  color: '#555555',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const roleBadgeColor: Record<string, string> = {
  Direttrice: '#e8a020',
  'Vice Direttore': '#c87d10',
  'Responsabile Vendite': '#3b82f6',
  'Venditore Senior': '#22c55e',
  Venditore: '#6b7280',
  Stagista: '#4b5563',
};

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: `${color}20`,
        border: `0.5px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: color,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}

export default function PannelloAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Venditore');
  const [saving, setSaving] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<Profile | null>(null);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('cognome');
    setProfiles(data || []);
    setLoading(false);
  }

  function openEdit(p: Profile) {
    setEditingUser(p);
    setEditRole((p.role && ROLES.includes(p.role as UserRole)) ? p.role as UserRole : 'Venditore');
  }

  async function handleSaveRole() {
    if (!editingUser) return;
    setSaving(true);
    await supabase.from('profiles').update({ role: editRole }).eq('id', editingUser.id);
    await fetchProfiles();
    setEditingUser(null);
    setSaving(false);
  }

  async function handleToggleActive(p: Profile) {
    await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id);
    setToggleConfirm(null);
    fetchProfiles();
  }

  const metricCards = [
    { label: 'Utenti Totali', value: profiles.length, color: '#ffffff' },
    { label: 'Account Attivi', value: profiles.filter(p => p.is_active && p.role).length, color: '#4caf50' },
    { label: 'In Attesa di Ruolo', value: profiles.filter(p => !p.role).length, color: '#e8a020' },
    { label: 'Account Disattivati', value: profiles.filter(p => !p.is_active).length, color: '#f87171' },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Pannello Admin</span>
        <span style={{ fontSize: '11px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
          Gestione Utenti
        </span>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {metricCards.map(m => (
          <div key={m.label} style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 500, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                  <th style={thStyle}>Utente</th>
                  <th style={thStyle}>Discord</th>
                  <th style={thStyle}>Ruolo</th>
                  <th style={thStyle}>Stato</th>
                  <th style={{ ...thStyle, width: '60px' }} />
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => {
                  const hasAssignedRole = p.role && ROLES.includes(p.role as UserRole);
                  const badgeColor = hasAssignedRole ? (roleBadgeColor[p.role] || '#4b5563') : '#4b5563';
                  const displayName = fullName(p) || p.nome || '?';
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '0.5px solid #1a1a1a', transition: 'background-color 0.1s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff05')}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <InitialsAvatar name={displayName} color={badgeColor} />
                          <div>
                            <div style={{ color: p.is_active ? '#ffffff' : '#555555', fontWeight: 500, fontSize: '13px' }}>
                              {displayName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#555555', fontSize: '12px' }}>{p.discord_username || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {hasAssignedRole ? (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: badgeColor,
                            backgroundColor: `${badgeColor}20`,
                            border: `0.5px solid ${badgeColor}44`,
                            borderRadius: '6px',
                            padding: '3px 8px',
                          }}>
                            {p.role}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#e8a020',
                            backgroundColor: '#e8a02015',
                            border: '0.5px solid #e8a02033',
                            borderRadius: '6px',
                            padding: '3px 8px',
                          }}>
                            Senza ruolo
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: p.is_active ? '#4caf50' : '#555555',
                          backgroundColor: p.is_active ? 'rgba(76,175,80,0.1)' : 'rgba(85,85,85,0.1)',
                          border: `0.5px solid ${p.is_active ? 'rgba(76,175,80,0.3)' : '#2a2a2a'}`,
                          borderRadius: '6px',
                          padding: '3px 8px',
                        }}>
                          {p.is_active ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => openEdit(p)}
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            title="Modifica ruolo"
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                            <IconPencil size={13} />
                          </button>
                          <button onClick={() => setToggleConfirm(p)}
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            title={p.is_active ? 'Disattiva account' : 'Riattiva account'}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = p.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(76,175,80,0.1)';
                              (e.currentTarget as HTMLButtonElement).style.color = p.is_active ? '#f87171' : '#4caf50';
                            }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                            {p.is_active ? <IconUserOff size={13} /> : <IconUserCheck size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <Modal title={`Modifica Ruolo — ${fullName(editingUser)}`} onClose={() => setEditingUser(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nome RP</label>
              <div style={{ ...inputStyle, color: '#888888', cursor: 'default' }}>{editingUser.nome || '—'} {editingUser.cognome || ''}</div>
            </div>
            <div>
              <label style={labelStyle}>Discord</label>
              <div style={{ ...inputStyle, color: '#888888', cursor: 'default' }}>{editingUser.discord_username || '—'}</div>
            </div>
            <div>
              <label style={labelStyle}>Ruolo Attuale</label>
              <div style={{ ...inputStyle, color: '#888888', cursor: 'default' }}>{editingUser.role || 'Nessun ruolo assegnato'}</div>
            </div>
            <div>
              <label style={labelStyle}>Nuovo Ruolo</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button onClick={() => setEditingUser(null)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                Annulla
              </button>
              <button onClick={handleSaveRole} disabled={saving}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'none')}>
                {saving ? 'Salvataggio...' : 'Assegna Ruolo'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toggleConfirm && (
        <Modal title={toggleConfirm.is_active ? 'Disattiva Account' : 'Riattiva Account'} onClose={() => setToggleConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>
            {toggleConfirm.is_active
              ? `Disattivare l'account di ${fullName(toggleConfirm)}? L'utente non potrà più accedere.`
              : `Riattivare l'account di ${fullName(toggleConfirm)}?`}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setToggleConfirm(null)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Annulla
            </button>
            <button
              onClick={() => handleToggleActive(toggleConfirm)}
              style={{
                flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
                backgroundColor: toggleConfirm.is_active ? '#dc2626' : '#16a34a',
                color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
              {toggleConfirm.is_active ? 'Disattiva' : 'Riattiva'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
