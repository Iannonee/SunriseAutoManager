import { useEffect, useState } from 'react';
import { IconCash, IconPlus, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FazioneFinanza, FazionePercentuale, FAZIONE_ROLES, isFazioneLeader } from '../../types';

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

interface FormState { descrizione: string; tipo: 'Entrata' | 'Uscita'; importo: string; note: string; }
const emptyForm = (): FormState => ({ descrizione: '', tipo: 'Entrata', importo: '', note: '' });

export default function Finanze() {
  const { profile } = useAuth();
  const isLeader = isFazioneLeader(profile?.ruolo_fazione);

  const [finanze, setFinanze] = useState<FazioneFinanza[]>([]);
  const [percentuali, setPercentuali] = useState<FazionePercentuale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FazioneFinanza | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FazioneFinanza | null>(null);
  const [editPct, setEditPct] = useState<FazionePercentuale | null>(null);
  const [editPctValue, setEditPctValue] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: f }, { data: p }] = await Promise.all([
      supabase.from('fazione_finanze').select('*').order('created_at', { ascending: false }),
      supabase.from('fazione_percentuali').select('*').order('ruolo'),
    ]);
    setFinanze(f || []);
    setPercentuali(p || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(emptyForm()); setShowForm(true); }
  function openEdit(f: FazioneFinanza) {
    setEditing(f);
    setForm({ descrizione: f.descrizione, tipo: f.tipo, importo: String(f.importo), note: f.note || '' });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.descrizione.trim() || !form.importo) return;
    setSaving(true);
    const payload = {
      descrizione: form.descrizione.trim(),
      tipo: form.tipo,
      importo: parseFloat(form.importo),
      note: form.note.trim() || null,
      created_by: profile?.id,
    };
    if (editing) {
      await supabase.from('fazione_finanze').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('fazione_finanze').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('fazione_finanze').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchAll();
  }

  async function handleSavePct() {
    if (!editPct) return;
    const val = parseFloat(editPctValue);
    if (isNaN(val)) return;
    await supabase.from('fazione_percentuali').update({ percentuale: val, updated_by: profile?.id, updated_at: new Date().toISOString() }).eq('id', editPct.id);
    setEditPct(null);
    fetchAll();
  }

  const entrate = finanze.filter(f => f.tipo === 'Entrata').reduce((s, f) => s + f.importo, 0);
  const uscite = finanze.filter(f => f.tipo === 'Uscita').reduce((s, f) => s + f.importo, 0);
  const cassa = entrate - uscite;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconCash size={18} color="#ffffff" />
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Finanze</span>
        </div>
        {isLeader && (
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <IconPlus size={14} />
            Aggiungi
          </button>
        )}
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Cassa Totale</div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: cassa >= 0 ? '#ffffff' : '#ef5350' }}>{fmt(cassa)}</div>
        </div>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Entrate Totali</div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#4caf50' }}>{fmt(entrate)}</div>
        </div>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Uscite Totali</div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#ef5350' }}>{fmt(uscite)}</div>
        </div>
      </div>

      {/* Percentuali */}
      {percentuali.length > 0 && (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>Percentuali per Ruolo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {percentuali.map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#cccccc' }}>{p.ruolo}</span>
                    {isLeader && editPct?.id === p.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editPctValue}
                          onChange={e => setEditPctValue(e.target.value)}
                          style={{ ...inputStyle, width: '80px', padding: '4px 8px', fontSize: '12px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                          min={0} max={100} step={0.01}
                        />
                        <button onClick={handleSavePct} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#ffffff', color: '#000000', fontSize: '11px', cursor: 'pointer' }}>OK</button>
                        <button onClick={() => setEditPct(null)} style={{ padding: '4px 6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#555555', cursor: 'pointer' }}><IconX size={12} /></button>
                      </div>
                    ) : (
                      isLeader && (
                        <button onClick={() => { setEditPct(p); setEditPctValue(String(p.percentuale)); }} style={{ padding: '2px 4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: '#444444', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#aaaaaa')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#444444')}>
                          <IconPencil size={11} />
                        </button>
                      )
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#888888' }}>{p.percentuale}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '2px', width: `${Math.min(p.percentuale, 100)}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#555555', marginTop: '4px' }}>
                  Quota: {fmt(cassa * p.percentuale / 100)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                  {['Descrizione', 'Tipo', 'Importo', 'Data', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finanze.map(f => (
                  <tr key={f.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff05')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '10px 14px', color: '#ffffff' }}>
                      <div>{f.descrizione}</div>
                      {f.note && <div style={{ fontSize: '11px', color: '#555555', marginTop: '2px' }}>{f.note}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 500,
                        color: f.tipo === 'Entrata' ? '#4caf50' : '#ef5350',
                        backgroundColor: f.tipo === 'Entrata' ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
                        border: `0.5px solid ${f.tipo === 'Entrata' ? 'rgba(76,175,80,0.3)' : 'rgba(239,83,80,0.3)'}`,
                        borderRadius: '6px', padding: '3px 8px',
                      }}>{f.tipo}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: f.tipo === 'Entrata' ? '#4caf50' : '#ef5350', fontWeight: 500 }}>
                      {f.tipo === 'Uscita' ? '-' : '+'}{fmt(f.importo)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555555', fontSize: '12px' }}>
                      {new Date(f.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isLeader && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => openEdit(f)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                            <IconPencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(f)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef5350'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,83,80,0.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                            <IconTrash size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {finanze.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#444444', fontSize: '13px' }}>Nessun movimento registrato</td></tr>
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
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{editing ? 'Modifica Movimento' : 'Nuovo Movimento'}</span>
              <button onClick={() => setShowForm(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>
                <IconX size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Descrizione <span style={{ color: '#ffffff' }}>*</span></label>
                <input value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} style={inputStyle} placeholder="Descrizione movimento"
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Tipo <span style={{ color: '#ffffff' }}>*</span></label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'Entrata' | 'Uscita' }))} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                    <option value="Entrata">Entrata</option>
                    <option value="Uscita">Uscita</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Importo ($) <span style={{ color: '#ffffff' }}>*</span></label>
                  <input type="number" value={form.importo} onChange={e => setForm(f => ({ ...f, importo: e.target.value }))} style={inputStyle} placeholder="0.00" min={0} step={0.01}
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
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>Elimina Movimento</div>
            <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare il movimento "{deleteTarget.descrizione}"?</p>
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
