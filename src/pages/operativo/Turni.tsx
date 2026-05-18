import { useEffect, useState } from 'react';
import { IconPlus, IconPencil, IconTrash, IconClock } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Turno, Profile, isAdmin, fullName } from '../../types';
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

export default function Turni() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<Turno[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turno | null>(null);
  const [form, setForm] = useState({
    dipendente_id: '',
    data: new Date().toISOString().split('T')[0],
    ora_inizio: '09:00',
    ora_fine: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const admin = isAdmin(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [profRes, recRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
      // RLS handles filtering: non-admins only see their own turni
      supabase.from('turni').select('*, dipendente:profiles!dipendente_id(*)').order('data', { ascending: false }),
    ]);
    setProfiles(profRes.data || []);
    setRecords(recRes.data || []);
    setLoading(false);
  }

  function calcOre(inizio: string, fine: string): number {
    const [ih, im] = inizio.split(':').map(Number);
    const [fh, fm] = fine.split(':').map(Number);
    const totalMin = (fh * 60 + fm) - (ih * 60 + im);
    return Math.max(0, parseFloat((totalMin / 60).toFixed(2)));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      dipendente_id: profile?.id || '',
      data: new Date().toISOString().split('T')[0],
      ora_inizio: '09:00',
      ora_fine: '18:00',
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(t: Turno) {
    setEditing(t);
    setForm({
      dipendente_id: t.dipendente_id || '',
      data: t.data,
      ora_inizio: t.ora_inizio,
      ora_fine: t.ora_fine,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.dipendente_id) { setError('Seleziona un dipendente.'); return; }
    if (form.ora_fine <= form.ora_inizio) { setError("L'ora di fine deve essere successiva all'ora di inizio."); return; }

    // Non-admins can only create/edit their own turni
    if (!admin && form.dipendente_id !== profile?.id) {
      setError('Puoi inserire solo il tuo turno.');
      return;
    }

    setSaving(true);
    const payload = {
      dipendente_id: form.dipendente_id,
      data: form.data,
      ora_inizio: form.ora_inizio,
      ora_fine: form.ora_fine,
      ore_totali: calcOre(form.ora_inizio, form.ora_fine),
    };

    if (editing) {
      await supabase.from('turni').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('turni').insert({ ...payload, created_by: profile?.id });
    }
    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('turni').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

  function canEditTurno(t: Turno): boolean {
    if (admin) return true;
    return t.created_by === profile?.id;
  }

  // Last turno for current user
  const myLastTurno = records.find(r => r.dipendente_id === profile?.id);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Turni</span>
          <span style={{ fontSize: '11px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
            {admin ? `${records.length} turni` : 'I tuoi turni'}
          </span>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          <IconPlus size={15} />
          Aggiungi Turno
        </button>
      </div>

      {/* Il mio ultimo turno */}
      {myLastTurno && (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
            Il mio ultimo turno
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconClock size={14} style={{ color: '#e8a020' }} />
              <span style={{ fontSize: '13px', color: '#ffffff' }}>{formatDate(myLastTurno.data)}</span>
            </div>
            <span style={{ fontSize: '13px', color: '#888888' }}>{myLastTurno.ora_inizio.slice(0, 5)} — {myLastTurno.ora_fine.slice(0, 5)}</span>
            <span style={{ fontSize: '12px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
              {myLastTurno.ore_totali}h
            </span>
          </div>
        </div>
      )}

      {!admin && (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#888888' }}>
          Puoi visualizzare e modificare solo i tuoi turni. La direzione può vedere tutti i turni.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessun turno registrato.</div>
      ) : (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                  <th style={thStyle}>Dipendente</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Inizio</th>
                  <th style={thStyle}>Fine</th>
                  <th style={thStyle}>Ore Totali</th>
                  <th style={{ ...thStyle, width: '60px' }} />
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const editable = canEditTurno(r);
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '0.5px solid #1a1a1a', transition: 'background-color 0.1s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff05')}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px', color: '#ffffff', fontWeight: 500 }}>{r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#888888' }}>{formatDate(r.data)}</td>
                      <td style={{ padding: '10px 14px', color: '#888888' }}>{r.ora_inizio.slice(0, 5)}</td>
                      <td style={{ padding: '10px 14px', color: '#888888' }}>{r.ora_fine.slice(0, 5)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '12px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
                          {r.ore_totali}h
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {editable && (
                            <button onClick={() => openEdit(r)}
                              style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                              <IconPencil size={13} />
                            </button>
                          )}
                          {admin && (
                            <button onClick={() => setDeleteConfirm(r.id)}
                              style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                              <IconTrash size={13} />
                            </button>
                          )}
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

      {modalOpen && (
        <Modal title={editing ? 'Modifica Turno' : 'Aggiungi Turno'} onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Dipendente</label>
              {admin ? (
                <select value={form.dipendente_id} onChange={e => setForm(f => ({ ...f, dipendente_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                  <option value="">Seleziona dipendente</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{fullName(p)} — {p.role}</option>
                  ))}
                </select>
              ) : (
                <div style={{ ...inputStyle, color: '#888888', cursor: 'default' }}>
                  {profile ? `${fullName(profile)} (tu)` : '—'}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Ora Inizio</label>
                <input type="time" value={form.ora_inizio} onChange={e => setForm(f => ({ ...f, ora_inizio: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Ora Fine</label>
                <input type="time" value={form.ora_fine} onChange={e => setForm(f => ({ ...f, ora_fine: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
            </div>
            <div style={{ backgroundColor: '#0a0a0a', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '10px 14px' }}>
              <span style={{ fontSize: '13px', color: '#888888' }}>
                Ore calcolate:{' '}
                <span style={{ color: '#ffffff', fontWeight: 500 }}>{calcOre(form.ora_inizio, form.ora_fine)}h</span>
              </span>
            </div>
            {error && <div style={{ fontSize: '13px', color: '#f87171' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                Annulla
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'none')}>
                {saving ? 'Salvataggio...' : editing ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare questo turno?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Annulla
            </button>
            <button onClick={() => handleDelete(deleteConfirm)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#dc2626')}>
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
