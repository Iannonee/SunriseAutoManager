import { useEffect, useState } from 'react';
import { IconUsers, IconPlus, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { FazioneMembro, FAZIONE_ROLES, isFazioneLeader } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 500, color: '#555555',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  backgroundColor: '#0a0a0a', border: '0.5px solid #2a2a2a',
  color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { result += syms[i]; n -= vals[i]; } }
  return result;
}

const roleBadge: Record<string, string> = {
  Capo: '#ffffff', Vicecapo: '#aaaaaa', Mercenario: '#888888', Soldato: '#555555',
};

interface FormState { nome: string; cognome: string; ruolo: string; stato: boolean; data_ingresso: string; note: string; }
const emptyForm = (): FormState => ({ nome: '', cognome: '', ruolo: 'Soldato', stato: true, data_ingresso: new Date().toISOString().slice(0,10), note: '' });

export default function Membri() {
  const { profile } = useAuth();
  const isLeader = isFazioneLeader(profile?.ruolo_fazione);
  const [membri, setMembri] = useState<FazioneMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FazioneMembro | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FazioneMembro | null>(null);

  useEffect(() => { fetchMembri(); }, []);

  async function fetchMembri() {
    setLoading(true);
    const { data } = await supabase.from('fazione_membri').select('*').order('cognome');
    setMembri(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(emptyForm()); setShowForm(true); }
  function openEdit(m: FazioneMembro) { setEditing(m); setForm({ nome: m.nome, cognome: m.cognome, ruolo: m.ruolo, stato: m.stato, data_ingresso: m.data_ingresso, note: m.note || '' }); setShowForm(true); }

  async function handleSave() {
    if (!form.nome.trim() || !form.cognome.trim()) return;
    setSaving(true);
    const payload = { nome: form.nome.trim(), cognome: form.cognome.trim(), ruolo: form.ruolo, stato: form.stato, data_ingresso: form.data_ingresso, note: form.note.trim() || null, created_by: profile?.id };
    if (editing) {
      await supabase.from('fazione_membri').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('fazione_membri').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchMembri();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('fazione_membri').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchMembri();
  }

  const totale = membri.length;
  const mercenari = membri.filter(m => m.ruolo === 'Mercenario').length;
  const soldati = membri.filter(m => m.ruolo === 'Soldato').length;
  const comando = membri.filter(m => m.ruolo === 'Capo' || m.ruolo === 'Vicecapo').length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconUsers size={18} color="#ffffff" />
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Membri</span>
        </div>
        {isLeader && (
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <IconPlus size={14} />
            Aggiungi
          </button>
        )}
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Totale Membri', value: totale, color: '#ffffff' },
          { label: 'Mercenari', value: mercenari, color: '#888888' },
          { label: 'Soldati', value: soldati, color: '#666666' },
          { label: 'Comando', value: comando, color: '#aaaaaa' },
        ].map(m => (
          <div key={m.label} style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 500, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                  {['#', 'Nome', 'Cognome', 'Ruolo', 'Stato', 'Ingresso', 'Note', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membri.map((m, i) => {
                  const color = roleBadge[m.ruolo] || '#555555';
                  return (
                    <tr key={m.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff05')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '10px 14px', color: '#444444', fontSize: '11px' }}>{toRoman(i + 1)}</td>
                      <td style={{ padding: '10px 14px', color: '#ffffff', fontWeight: 500 }}>{m.nome}</td>
                      <td style={{ padding: '10px 14px', color: '#cccccc' }}>{m.cognome}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', color, backgroundColor: `${color}15`, border: `0.5px solid ${color}33`, borderRadius: '6px', padding: '3px 8px' }}>{m.ruolo}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', color: m.stato ? '#4caf50' : '#555555', backgroundColor: m.stato ? 'rgba(76,175,80,0.1)' : 'rgba(85,85,85,0.1)', border: `0.5px solid ${m.stato ? 'rgba(76,175,80,0.3)' : '#2a2a2a'}`, borderRadius: '6px', padding: '3px 8px' }}>
                          {m.stato ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#555555', fontSize: '12px' }}>{new Date(m.data_ingresso).toLocaleDateString('it-IT')}</td>
                      <td style={{ padding: '10px 14px', color: '#555555', fontSize: '12px', maxWidth: '160px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {isLeader && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => openEdit(m)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                              <IconPencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget(m)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef5350'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,83,80,0.1)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                              <IconTrash size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {membri.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#444444', fontSize: '13px' }}>Nessun membro registrato</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{editing ? 'Modifica Membro' : 'Nuovo Membro'}</span>
              <button onClick={() => setShowForm(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>
                <IconX size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome <span style={{ color: '#ffffff' }}>*</span></label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle} placeholder="Nome"
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
                <div>
                  <label style={labelStyle}>Cognome <span style={{ color: '#ffffff' }}>*</span></label>
                  <input value={form.cognome} onChange={e => setForm(f => ({ ...f, cognome: e.target.value }))} style={inputStyle} placeholder="Cognome"
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Ruolo <span style={{ color: '#ffffff' }}>*</span></label>
                  <select value={form.ruolo} onChange={e => setForm(f => ({ ...f, ruolo: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                    {FAZIONE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data Ingresso</label>
                  <input type="date" value={form.data_ingresso} onChange={e => setForm(f => ({ ...f, data_ingresso: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Stato</label>
                <button onClick={() => setForm(f => ({ ...f, stato: !f.stato }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', backgroundColor: '#0a0a0a', border: '0.5px solid #2a2a2a', cursor: 'pointer', width: '100%' }}>
                  <div style={{ width: '32px', height: '18px', borderRadius: '9px', backgroundColor: form.stato ? '#ffffff' : '#333333', transition: 'background-color 0.2s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: form.stato ? '#000000' : '#666666', position: 'absolute', top: '2px', left: form.stato ? '16px' : '2px', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: form.stato ? '#ffffff' : '#555555' }}>{form.stato ? 'Attivo' : 'Inattivo'}</span>
                </button>
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
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>Elimina Membro</div>
            <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Rimuovere {deleteTarget.nome} {deleteTarget.nome} dalla lista?</p>
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
