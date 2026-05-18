import { useEffect, useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ComunicazioneStaff, ComunicazioneStaffTipo, Profile, ROLES, canWriteComunicazioniStaff, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

const TIPI: ComunicazioneStaffTipo[] = ['Promozione', 'Retrocessione', 'Richiamo Verbale', 'Richiamo Ufficiale', 'Retrocessione Disciplinare', 'Espulsione'];

const tipoStyle: Record<ComunicazioneStaffTipo, { bg: string; color: string; border: string }> = {
  Promozione: { bg: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'rgba(76,175,80,0.3)' },
  Retrocessione: { bg: 'rgba(255,140,0,0.1)', color: '#ff8c00', border: 'rgba(255,140,0,0.3)' },
  'Richiamo Verbale': { bg: 'rgba(232,160,32,0.1)', color: '#e8a020', border: 'rgba(232,160,32,0.3)' },
  'Richiamo Ufficiale': { bg: 'rgba(255,140,0,0.15)', color: '#ff8c00', border: 'rgba(255,140,0,0.4)' },
  'Retrocessione Disciplinare': { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Espulsione: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'rgba(239,68,68,0.5)' },
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

export default function ComunicazioniStaff() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<ComunicazioneStaff[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ tipo: ComunicazioneStaffTipo; dipendente_id: string; da_ruolo: string; a_ruolo: string; data: string; motivazione: string }>({
    tipo: 'Richiamo Verbale', dipendente_id: '', da_ruolo: '', a_ruolo: '',
    data: new Date().toISOString().split('T')[0], motivazione: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canWrite = canWriteComunicazioniStaff(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [rec, prof] = await Promise.all([
      supabase.from('comunicazioni_staff').select('*, dipendente:profiles!dipendente_id(*), creator:profiles!created_by(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
    ]);
    setRecords(rec.data || []);
    setProfiles(prof.data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm({ tipo: 'Richiamo Verbale', dipendente_id: '', da_ruolo: '', a_ruolo: '', data: new Date().toISOString().split('T')[0], motivazione: '' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.dipendente_id || !form.motivazione.trim()) { setError('Dipendente e motivazione obbligatori.'); return; }
    setSaving(true);
    const showRoles = form.tipo === 'Promozione' || form.tipo === 'Retrocessione';
    await supabase.from('comunicazioni_staff').insert({
      tipo: form.tipo,
      dipendente_id: form.dipendente_id,
      da_ruolo: showRoles ? form.da_ruolo || null : null,
      a_ruolo: showRoles ? form.a_ruolo || null : null,
      data: form.data,
      motivazione: form.motivazione.trim(),
      created_by: profile?.id,
    });
    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('comunicazioni_staff').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Comunicazioni Staff</span>
          <span style={{ fontSize: '11px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
            {records.length} comunicazioni
          </span>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            <IconPlus size={15} />
            Nuova Comunicazione
          </button>
        )}
      </div>

      {!canWrite && (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#888888' }}>
          Solo la direzione può pubblicare comunicazioni. Tu puoi solo consultare.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessuna comunicazione registrata.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {records.map(r => {
            const style = tipoStyle[r.tipo];
            return (
              <div
                key={r.id}
                style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '12px', padding: '16px 20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {/* Type badge */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: style.color,
                        backgroundColor: style.bg,
                        border: `0.5px solid ${style.border}`,
                        borderRadius: '6px',
                        padding: '3px 10px',
                      }}>
                        {r.tipo}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                        {r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}
                      </span>
                      {r.da_ruolo && r.a_ruolo && (
                        <span style={{ fontSize: '12px', color: '#888888' }}>
                          <span style={{ color: '#555555' }}>{r.da_ruolo}</span>
                          <span style={{ margin: '0 6px' }}>→</span>
                          <span style={{ color: '#e8a020' }}>{r.a_ruolo}</span>
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#888888', marginBottom: '8px' }}>{r.motivazione}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#444444' }}>
                      <span>{formatDate(r.data)}</span>
                      {r.creator && <span>Da: {fullName(r.creator as Parameters<typeof fullName>[0])}</span>}
                    </div>
                  </div>
                  {canWrite && (
                    <button onClick={() => setDeleteConfirm(r.id)}
                      style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555', flexShrink: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title="Nuova Comunicazione" onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as ComunicazioneStaffTipo }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Dipendente <span style={{ color: '#e8a020' }}>*</span></label>
              <select value={form.dipendente_id} onChange={e => setForm(f => ({ ...f, dipendente_id: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                <option value="">Seleziona dipendente</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{fullName(p)} — {p.role}</option>)}
              </select>
            </div>
            {(form.tipo === 'Promozione' || form.tipo === 'Retrocessione') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Da Ruolo</label>
                  <select value={form.da_ruolo} onChange={e => setForm(f => ({ ...f, da_ruolo: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                    <option value="">Seleziona</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>A Ruolo</label>
                  <select value={form.a_ruolo} onChange={e => setForm(f => ({ ...f, a_ruolo: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                    <option value="">Seleziona</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
            <div>
              <label style={labelStyle}>Motivazione <span style={{ color: '#e8a020' }}>*</span></label>
              <textarea value={form.motivazione} onChange={e => setForm(f => ({ ...f, motivazione: e.target.value }))} rows={4}
                style={{ ...inputStyle, resize: 'none' }} placeholder="Motivazione della comunicazione..."
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
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
                {saving ? 'Invio...' : 'Pubblica'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare questa comunicazione?</p>
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
