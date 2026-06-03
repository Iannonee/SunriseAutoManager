import { useEffect, useState } from 'react';
import { IconShirt, IconPlus, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FazioneOutfit, FAZIONE_ROLES, isFazioneLeader } from '../../types';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 500, color: '#555555',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  backgroundColor: '#0a0a0a', border: '0.5px solid #2a2a2a',
  color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

interface FormState { nome: string; ruoli_destinatari: string[]; descrizione: string; }
const emptyForm = (): FormState => ({ nome: '', ruoli_destinatari: [], descrizione: '' });

export default function Outfit() {
  const { profile } = useAuth();
  const isLeader = isFazioneLeader(profile?.ruolo_fazione);

  const [outfit, setOutfit] = useState<FazioneOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FazioneOutfit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FazioneOutfit | null>(null);

  useEffect(() => { fetchOutfit(); }, []);

  async function fetchOutfit() {
    setLoading(true);
    const { data } = await supabase.from('fazione_outfit').select('*').order('created_at', { ascending: false });
    setOutfit(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(emptyForm()); setShowForm(true); }
  function openEdit(o: FazioneOutfit) {
    setEditing(o);
    setForm({ nome: o.nome, ruoli_destinatari: [...o.ruoli_destinatari], descrizione: o.descrizione });
    setShowForm(true);
  }

  function toggleRuolo(r: string) {
    setForm(f => ({
      ...f,
      ruoli_destinatari: f.ruoli_destinatari.includes(r)
        ? f.ruoli_destinatari.filter(x => x !== r)
        : [...f.ruoli_destinatari, r],
    }));
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.descrizione.trim()) return;
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      ruoli_destinatari: form.ruoli_destinatari,
      descrizione: form.descrizione.trim(),
      created_by: profile?.id,
    };
    if (editing) {
      await supabase.from('fazione_outfit').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('fazione_outfit').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchOutfit();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('fazione_outfit').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchOutfit();
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconShirt size={18} color="#ffffff" />
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Outfit</span>
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
      ) : outfit.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444444', fontSize: '13px' }}>Nessun outfit registrato</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {outfit.map(o => (
            <div key={o.id} style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{o.nome}</div>
              {o.ruoli_destinatari.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {o.ruoli_destinatari.map(r => (
                    <span key={r} style={{ fontSize: '11px', color: '#aaaaaa', backgroundColor: '#ffffff10', border: '0.5px solid #ffffff22', borderRadius: '6px', padding: '3px 8px' }}>{r}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#888888', lineHeight: '1.5' }}>{o.descrizione}</div>
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
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{editing ? 'Modifica Outfit' : 'Nuovo Outfit'}</span>
              <button onClick={() => setShowForm(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>
                <IconX size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nome <span style={{ color: '#ffffff' }}>*</span></label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle} placeholder="Nome outfit"
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Ruoli Destinatari</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0a0a0a', border: '0.5px solid #2a2a2a' }}>
                  {FAZIONE_ROLES.map(r => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <div
                        onClick={() => toggleRuolo(r)}
                        style={{
                          width: '16px', height: '16px', borderRadius: '4px',
                          backgroundColor: form.ruoli_destinatari.includes(r) ? '#ffffff' : 'transparent',
                          border: `1px solid ${form.ruoli_destinatari.includes(r) ? '#ffffff' : '#444444'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, cursor: 'pointer',
                        }}
                      >
                        {form.ruoli_destinatari.includes(r) && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: form.ruoli_destinatari.includes(r) ? '#ffffff' : '#888888' }} onClick={() => toggleRuolo(r)}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descrizione <span style={{ color: '#ffffff' }}>*</span></label>
                <textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descrizione outfit"
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
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>Elimina Outfit</div>
            <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare "{deleteTarget.nome}"?</p>
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
