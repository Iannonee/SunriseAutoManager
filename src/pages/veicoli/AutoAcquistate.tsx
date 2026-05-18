import { useEffect, useState } from 'react';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import PriceInput, { parsePrice } from '../../components/ui/PriceInput';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AutoAcquistata, Profile, canEditAutoAcquistate, fullName } from '../../types';
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

export default function AutoAcquistate() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AutoAcquistata[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutoAcquistata | null>(null);
  const [form, setForm] = useState({
    modello: '',
    colore: '',
    prezzo_acquisto: '',
    venduto_da: '',
    dipendente_id: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).order('cognome');
    setProfiles(data || []);
  }

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('auto_acquistate')
      .select('*, dipendente:profiles!dipendente_id(*), creator:profiles!created_by(*)')
      .order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      modello: '', colore: '', prezzo_acquisto: '', venduto_da: '',
      dipendente_id: profile?.id || '',
      data: new Date().toISOString().split('T')[0],
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: AutoAcquistata) {
    setEditing(r);
    setForm({
      modello: r.modello,
      colore: r.colore,
      prezzo_acquisto: String(r.prezzo_acquisto),
      venduto_da: r.venduto_da,
      dipendente_id: r.dipendente_id || '',
      data: r.data,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.modello.trim() || !form.colore.trim() || !form.venduto_da.trim()) {
      setError('Modello, colore e venditore/contatto sono obbligatori.');
      return;
    }
    setSaving(true);

    const payload = {
      modello: form.modello.trim(),
      colore: form.colore.trim(),
      prezzo_acquisto: parsePrice(form.prezzo_acquisto),
      venduto_da: form.venduto_da.trim(),
      dipendente_id: form.dipendente_id || null,
      data: form.data,
    };

    if (editing) {
      await supabase.from('auto_acquistate').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('auto_acquistate').insert({ ...payload, created_by: profile?.id });

      // Auto-create inventario record with "Da completare" status
      await supabase.from('inventario').insert({
        modello: form.modello.trim(),
        colore: form.colore.trim(),
        prezzo_acquisto: parsePrice(form.prezzo_acquisto),
        condizioni: 3,
        trattabile: false,
        stato: 'Da completare',
        created_by: profile?.id,
      });
    }

    await fetchData();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('auto_acquistate').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchData();
  }

  const formatEuro = (n: number) => `$ ${n.toLocaleString('it-IT')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT');
  const canEdit = canEditAutoAcquistate(profile?.role);

  const totalSpesa = records.reduce((s, r) => s + r.prezzo_acquisto, 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Auto Acquistate</span>
          <span
            style={{
              fontSize: '11px',
              color: '#e8a020',
              backgroundColor: '#e8a02015',
              border: '0.5px solid #e8a02033',
              borderRadius: '6px',
              padding: '2px 8px',
            }}
          >
            {records.length} acquisti
          </span>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#e8a020',
            color: '#000000',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          <IconPlus size={15} />
          Nuovo Acquisto
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Totale Acquisti</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#ffffff' }}>{records.length}</div>
        </div>
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Spesa Totale</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#e8a020' }}>{formatEuro(totalSpesa)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessun acquisto registrato.</div>
      ) : (
        <div style={{ backgroundColor: '#0f0f0f', border: '0.5px solid #e8a02033', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                  <th style={thStyle}>Modello</th>
                  <th style={thStyle}>Colore</th>
                  <th style={thStyle}>Prezzo Acquisto</th>
                  <th style={thStyle}>Venduto Da</th>
                  <th style={thStyle}>Dipendente</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Aggiunto Da</th>
                  {canEdit && <th style={{ ...thStyle, width: '60px' }} />}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '0.5px solid #1a1a1a', transition: 'background-color 0.1s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#ffffff05')}
                    onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', color: '#ffffff', fontWeight: 500 }}>{r.modello}</td>
                    <td style={{ padding: '10px 14px', color: '#888888' }}>{r.colore}</td>
                    <td style={{ padding: '10px 14px', color: '#e8a020', fontWeight: 500 }}>{formatEuro(r.prezzo_acquisto)}</td>
                    <td style={{ padding: '10px 14px', color: '#888888' }}>{r.venduto_da}</td>
                    <td style={{ padding: '10px 14px', color: '#888888' }}>{r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#888888' }}>{formatDate(r.data)}</td>
                    <td style={{ padding: '10px 14px', color: '#555555', fontSize: '12px' }}>{r.creator ? fullName(r.creator as Parameters<typeof fullName>[0]) : '—'}</td>
                    {canEdit && (
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openEdit(r)}
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                          >
                            <IconPencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(r.id)}
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Acquisto' : 'Registra Acquisto'} onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Modello <span style={{ color: '#e8a020' }}>*</span></label>
                <input value={form.modello} onChange={e => setForm(f => ({ ...f, modello: e.target.value }))}
                  style={inputStyle} placeholder="es. Audi A4"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={labelStyle}>Colore <span style={{ color: '#e8a020' }}>*</span></label>
                <input value={form.colore} onChange={e => setForm(f => ({ ...f, colore: e.target.value }))}
                  style={inputStyle} placeholder="es. Grigio"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Prezzo Acquisto ($)</label>
              <PriceInput value={form.prezzo_acquisto} onChange={v => setForm(f => ({ ...f, prezzo_acquisto: v }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>

            <div>
              <label style={labelStyle}>Venduto Da (nome/contatto) <span style={{ color: '#e8a020' }}>*</span></label>
              <input value={form.venduto_da} onChange={e => setForm(f => ({ ...f, venduto_da: e.target.value }))}
                style={inputStyle} placeholder="es. Giuseppe Bianchi"
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>

            <div>
              <label style={labelStyle}>Dipendente che ha gestito</label>
              <select value={form.dipendente_id} onChange={e => setForm(f => ({ ...f, dipendente_id: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                <option value="">Seleziona dipendente</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{fullName(p)} — {p.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                style={inputStyle}
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
                {saving ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Registra Acquisto'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare questo record?</p>
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
