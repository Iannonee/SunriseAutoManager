import { useEffect, useState } from 'react';
import { IconSword, IconPlus, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FazioneOperazione, isFazioneLeader } from '../../types';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 500, color: '#555555',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  backgroundColor: '#0a0a0a', border: '0.5px solid #2a2a2a',
  color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

function fmt(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

const STATI = ['Completata', 'In corso', 'Fallita'] as const;
type Stato = typeof STATI[number];

const statoStyle: Record<Stato, { color: string; bg: string; border: string }> = {
  Completata: { color: '#4caf50', bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.3)' },
  'In corso': { color: '#e8a020', bg: 'rgba(232,160,32,0.1)', border: 'rgba(232,160,32,0.3)' },
  Fallita: { color: '#ef5350', bg: 'rgba(239,83,80,0.1)', border: 'rgba(239,83,80,0.3)' },
};

interface FormState { titolo: string; stato: Stato; data: string; partecipanti: string; importo: string; note: string; }
const emptyForm = (): FormState => ({ titolo: '', stato: 'In corso', data: new Date().toISOString().slice(0,10), partecipanti: '', importo: '', note: '' });

export default function Operazioni() {
  const { profile } = useAuth();
  const isLeader = isFazioneLeader(profile?.ruolo_fazione);

  const [operazioni, setOperazioni] = useState<FazioneOperazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FazioneOperazione | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FazioneOperazione | null>(null);

  useEffect(() => { fetchOperazioni(); }, []);

  async function fetchOperazioni() {
    setLoading(true);
    const { data } = await supabase.from('fazione_operazioni').select('*').order('data', { ascending: false });
    setOperazioni(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(emptyForm()); setShowForm(true); }
  function openEdit(o: FazioneOperazione) {
    setEditing(o);
    setForm({ titolo: o.titolo, stato: o.stato, data: o.data, partecipanti: String(o.partecipanti), importo: String(o.importo), note: o.note || '' });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titolo.trim()) return;
    setSaving(true);
    const payload = {
      titolo: form.titolo.trim(),
      stato: form.stato,
      data: form.data,
      partecipanti: parseInt(form.partecipanti) || 0,
      importo: parseFloat(form.importo) || 0,
      note: form.note.trim() || null,
      created_by: profile?.id,
    };
    if (editing) {
      await supabase.from('fazione_operazioni').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('fazione_operazioni').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchOperazioni();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('fazione_operazioni').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchOperazioni();
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconSword size={18} color="#ffffff" />
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Operazioni</span>
        </div>
        {isLeader && (
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <IconPlus size={14} />
            Aggiungi
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : operazioni.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444444', fontSize: '13px' }}>Nessuna operazione registrata</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {operazioni.map(o => {
            const s = statoStyle[o.stato];
            return (
              <div key={o.id} style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', flex: 1 }}>{o.titolo}</div>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: s.color, backgroundColor: s.bg, border: `0.5px solid ${s.border}`, borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {o.stato}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#444444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Data</div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>{new Date(o.data).toLocaleDateString('it-IT')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#444444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Partecipanti</div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>{o.partecipanti}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#444444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Importo</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: o.importo >= 0 ? '#4caf50' : '#ef5350' }}>
                      {o.importo >= 0 ? '+' : ''}{fmt(o.importo)}
                    </div>
                  </div>
                </div>
                {o.note && (
                  <div style={{ fontSize: '12px', color: '#555555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.note}
                  </div>
                )}
                {isLeader && (
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '0.5px solid #1a1a1a' }}>
                    <button onClick={() => openEdit(o)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555', fontSize: '11px' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffffff33'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; }}>
                      <IconPencil size={11} /> Modifica
                    </button>
                    <button onClick={() => setDeleteTarget(o)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555', fontSize: '11px' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef5350'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,83,80,0.3)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; }}>
                      <IconTrash size={11} /> Elimina
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{editing ? 'Modifica Operazione' : 'Nuova Operazione'}</span>
              <button onClick={() => setShowForm(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>
                <IconX size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Titolo <span style={{ color: '#ffffff' }}>*</span></label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} style={inputStyle} placeholder="Titolo operazione"
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Stato <span style={{ color: '#ffffff' }}>*</span></label>
                  <select value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value as Stato }))} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                    {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data <span style={{ color: '#ffffff' }}>*</span></label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Partecipanti</label>
                  <input type="number" value={form.partecipanti} onChange={e => setForm(f => ({ ...f, partecipanti: e.target.value }))} style={inputStyle} placeholder="0" min={0}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
                <div>
                  <label style={labelStyle}>Importo ($)</label>
                  <input type="number" value={form.importo} onChange={e => setForm(f => ({ ...f, importo: e.target.value }))} style={inputStyle} placeholder="+ entrata / - perdita" step={0.01}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Note</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} placeholder="Note opzionali"
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>Annulla</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#000000', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Salvataggio...' : (editing ? 'Salva' : 'Aggiungi')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>Elimina Operazione</div>
            <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare "{deleteTarget.titolo}"?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}>Annulla</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#ef5350', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
