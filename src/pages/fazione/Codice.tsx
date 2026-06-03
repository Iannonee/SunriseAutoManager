import { useEffect, useState } from 'react';
import { IconBook, IconPlus, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FazioneCodice, isFazioneLeader } from '../../types';

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

interface FormState { titolo: string; descrizione: string; }
const emptyForm = (): FormState => ({ titolo: '', descrizione: '' });

export default function Codice() {
  const { profile } = useAuth();
  const isLeader = isFazioneLeader(profile?.ruolo_fazione);

  const [codice, setCodice] = useState<FazioneCodice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FazioneCodice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FazioneCodice | null>(null);

  useEffect(() => { fetchCodice(); }, []);

  async function fetchCodice() {
    setLoading(true);
    const { data } = await supabase.from('fazione_codice').select('*').order('ordine');
    setCodice(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(emptyForm()); setShowForm(true); }
  function openEdit(c: FazioneCodice) {
    setEditing(c);
    setForm({ titolo: c.titolo, descrizione: c.descrizione });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titolo.trim() || !form.descrizione.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('fazione_codice').update({
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim(),
        updated_by: profile?.id,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
    } else {
      const nextNum = codice.length + 1;
      await supabase.from('fazione_codice').insert({
        numero: nextNum,
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim(),
        ordine: nextNum,
        updated_by: profile?.id,
        updated_at: new Date().toISOString(),
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchCodice();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('fazione_codice').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchCodice();
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconBook size={18} color="#ffffff" />
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Codice della Fazione</span>
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
      ) : codice.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444444', fontSize: '13px' }}>Nessuna regola definita</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {codice.map(c => (
            <div key={c.id} style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #ffffff11', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#2a2a2a', fontFamily: 'serif', flexShrink: 0, minWidth: '48px', lineHeight: '1' }}>
                {toRoman(c.numero)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>{c.titolo}</div>
                <div style={{ fontSize: '13px', color: '#888888', lineHeight: '1.6' }}>{c.descrizione}</div>
              </div>
              {isLeader && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(c)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                    <IconPencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef5350'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,83,80,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                    <IconTrash size={13} />
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
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>
                {editing ? `Modifica Regola ${toRoman(editing.numero)}` : `Nuova Regola ${toRoman(codice.length + 1)}`}
              </span>
              <button onClick={() => setShowForm(false)} style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555555')}>
                <IconX size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Titolo <span style={{ color: '#ffffff' }}>*</span></label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} style={inputStyle} placeholder="Titolo regola"
                  onFocus={e => (e.currentTarget.style.borderColor = '#ffffff33')} onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Descrizione <span style={{ color: '#ffffff' }}>*</span></label>
                <textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descrizione della regola"
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
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', marginBottom: '10px' }}>Elimina Regola</div>
            <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare la regola "{deleteTarget.titolo}"?</p>
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
