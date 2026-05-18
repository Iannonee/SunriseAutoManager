import { useEffect, useState } from 'react';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import PriceInput, { parsePrice } from '../../components/ui/PriceInput';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BilancioRecord, fullName } from '../../types';
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

export default function Bilancio() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<BilancioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BilancioRecord | null>(null);
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    veicoli_acquistati: '',
    totale_speso: '',
    veicoli_venduti: '',
    totale_incassato: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('bilancio')
      .select('*, compilato_da:profiles!compilato_da_id(*)')
      .order('data', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ data: new Date().toISOString().split('T')[0], veicoli_acquistati: '', totale_speso: '', veicoli_venduti: '', totale_incassato: '', note: '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: BilancioRecord) {
    setEditing(r);
    setForm({
      data: r.data,
      veicoli_acquistati: String(r.veicoli_acquistati),
      totale_speso: String(r.totale_speso),
      veicoli_venduti: String(r.veicoli_venduti),
      totale_incassato: String(r.totale_incassato),
      note: r.note || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    const payload = {
      data: form.data,
      veicoli_acquistati: parseInt(form.veicoli_acquistati) || 0,
      totale_speso: parsePrice(form.totale_speso),
      veicoli_venduti: parseInt(form.veicoli_venduti) || 0,
      totale_incassato: parsePrice(form.totale_incassato),
      note: form.note.trim() || null,
    };
    if (editing) {
      await supabase.from('bilancio').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('bilancio').insert({ ...payload, compilato_da_id: profile?.id });
    }
    await fetchData();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('bilancio').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchData();
  }

  const totalIncassato = records.reduce((s, r) => s + r.totale_incassato, 0);
  const totalSpeso = records.reduce((s, r) => s + r.totale_speso, 0);
  const totalSaldo = totalIncassato - totalSpeso;
  const formatEuro = (n: number) => `$ ${n.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Bilancio</span>
          <span style={{ fontSize: '11px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
            {records.length} record
          </span>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          <IconPlus size={15} />
          Nuovo Giorno
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Totale Incassato</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#4caf50' }}>{formatEuro(totalIncassato)}</div>
        </div>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Totale Speso</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#f87171' }}>{formatEuro(totalSpeso)}</div>
        </div>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Saldo Totale</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: totalSaldo >= 0 ? '#4caf50' : '#f87171' }}>{formatEuro(totalSaldo)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessun record registrato.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {records.map(r => (
            <div
              key={r.id}
              style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '12px', padding: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>{formatDate(r.data)}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: r.saldo_giornaliero >= 0 ? '#4caf50' : '#f87171',
                      backgroundColor: r.saldo_giornaliero >= 0 ? 'rgba(76,175,80,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `0.5px solid ${r.saldo_giornaliero >= 0 ? 'rgba(76,175,80,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}>
                      Saldo: {formatEuro(r.saldo_giornaliero)}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                    {[
                      { label: 'Veicoli Acquistati', value: String(r.veicoli_acquistati), color: '#ffffff' },
                      { label: 'Totale Speso', value: formatEuro(r.totale_speso), color: '#f87171' },
                      { label: 'Veicoli Venduti', value: String(r.veicoli_venduti), color: '#ffffff' },
                      { label: 'Totale Incassato', value: formatEuro(r.totale_incassato), color: '#4caf50' },
                    ].map(item => (
                      <div key={item.label} style={{ backgroundColor: '#0a0a0a', borderRadius: '6px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#555555', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {r.note && <p style={{ fontSize: '12px', color: '#555555', marginTop: '8px' }}>{r.note}</p>}
                  <p style={{ fontSize: '11px', color: '#444444', marginTop: '6px' }}>
                    Compilato da: {r.compilato_da ? fullName(r.compilato_da as Parameters<typeof fullName>[0]) : '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(r)}
                    style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                    <IconPencil size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(r.id)}
                    style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}>
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Giorno' : 'Nuovo Giorno'} onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Veicoli Acquistati</label>
                <input type="number" value={form.veicoli_acquistati} onChange={e => setForm(f => ({ ...f, veicoli_acquistati: e.target.value }))}
                  style={inputStyle} placeholder="0"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Totale Speso ($)</label>
                <PriceInput value={form.totale_speso} onChange={v => setForm(f => ({ ...f, totale_speso: v }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Veicoli Venduti</label>
                <input type="number" value={form.veicoli_venduti} onChange={e => setForm(f => ({ ...f, veicoli_venduti: e.target.value }))}
                  style={inputStyle} placeholder="0"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Totale Incassato ($)</label>
                <PriceInput value={form.totale_incassato} onChange={v => setForm(f => ({ ...f, totale_incassato: v }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
            </div>
            <div style={{ backgroundColor: '#0a0a0a', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '10px 14px' }}>
              <span style={{ fontSize: '13px', color: '#888888' }}>
                Saldo giornaliero:{' '}
                <span style={{ color: parsePrice(form.totale_incassato) - parsePrice(form.totale_speso) >= 0 ? '#4caf50' : '#f87171', fontWeight: 500 }}>
                  {`$ ${(parsePrice(form.totale_incassato) - parsePrice(form.totale_speso)).toLocaleString('it-IT')}`}
                </span>
              </span>
            </div>
            <div>
              <label style={labelStyle}>Note</label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                style={{ ...inputStyle, resize: 'none' }} placeholder="Note aggiuntive..."
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
                {saving ? 'Salvataggio...' : editing ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare questo record di bilancio?</p>
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
