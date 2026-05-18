import { useEffect, useState } from 'react';
import { IconPlus, IconPencil, IconTrash, IconSearch } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BlacklistCliente, Profile, canManageBlacklist, canEditBlacklist, fullName } from '../../types';
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

export default function BlacklistClienti() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<BlacklistCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlacklistCliente | null>(null);
  const [form, setForm] = useState({ nome_cliente: '', data: new Date().toISOString().split('T')[0], motivo: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canAdd = canManageBlacklist(profile?.role);
  const canEdit = canEditBlacklist(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [rec] = await Promise.all([
      supabase.from('blacklist_clienti').select('*, aggiunto_da:profiles!aggiunto_da_id(*)').order('created_at', { ascending: false }),
    ]);
    setRecords(rec.data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ nome_cliente: '', data: new Date().toISOString().split('T')[0], motivo: '', note: '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: BlacklistCliente) {
    setEditing(r);
    setForm({ nome_cliente: r.nome_cliente, data: r.data, motivo: r.motivo, note: r.note || '' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.nome_cliente.trim() || !form.motivo.trim()) {
      setError('Nome cliente e motivo sono obbligatori.');
      return;
    }
    setSaving(true);
    const payload = { nome_cliente: form.nome_cliente.trim(), data: form.data, motivo: form.motivo.trim(), note: form.note.trim() || null };
    if (editing) {
      await supabase.from('blacklist_clienti').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('blacklist_clienti').insert({ ...payload, aggiunto_da_id: profile?.id, created_by: profile?.id });
    }
    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('blacklist_clienti').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const filtered = records.filter(r =>
    r.nome_cliente.toLowerCase().includes(search.toLowerCase()) ||
    r.motivo.toLowerCase().includes(search.toLowerCase())
  );
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Blacklist Clienti</span>
          <span style={{ fontSize: '11px', color: '#e8a020', backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', borderRadius: '6px', padding: '2px 8px' }}>
            {records.length} clienti
          </span>
        </div>
        {canAdd && (
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            <IconPlus size={15} />
            Aggiungi Cliente
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <IconSearch size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555555' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome o motivo..."
          style={{ ...inputStyle, paddingLeft: '32px' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessun cliente trovato.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(r => (
            <div
              key={r.id}
              style={{
                backgroundColor: '#0f0f0f',
                border: '0.5px solid #1e1e1e',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>{r.nome_cliente}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#f87171',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    border: '0.5px solid rgba(239,68,68,0.3)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                  }}>
                    Blacklist
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#888888', marginBottom: '4px' }}>{r.motivo}</p>
                {r.note && <p style={{ fontSize: '12px', color: '#555555', marginBottom: '6px' }}>{r.note}</p>}
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#444444' }}>
                  <span>{formatDate(r.data)}</span>
                  {r.aggiunto_da && (
                    <span>Aggiunto da: {fullName(r.aggiunto_da as Parameters<typeof fullName>[0])}</span>
                  )}
                </div>
              </div>
              {canEdit && (
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
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Record' : 'Aggiungi alla Blacklist'} onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nome Cliente <span style={{ color: '#e8a020' }}>*</span></label>
              <input value={form.nome_cliente} onChange={e => setForm(f => ({ ...f, nome_cliente: e.target.value }))}
                style={inputStyle} placeholder="Nome e Cognome"
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
            <div>
              <label style={labelStyle}>Motivo <span style={{ color: '#e8a020' }}>*</span></label>
              <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} rows={3}
                style={{ ...inputStyle, resize: 'none' }} placeholder="Motivo dell'inserimento in blacklist..."
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
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
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Rimuovere questo cliente dalla blacklist?</p>
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
              Rimuovi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
