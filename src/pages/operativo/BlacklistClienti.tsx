import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BlacklistCliente, Profile, canManageBlacklist, canEditBlacklist, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

export default function BlacklistClienti() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<BlacklistCliente[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
    const [rec, prof] = await Promise.all([
      supabase.from('blacklist_clienti').select('*, aggiunto_da:profiles!aggiunto_da_id(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
    ]);
    setRecords(rec.data || []);
    setProfiles(prof.data || []);
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

  const filtered = records.filter(r => r.nome_cliente.toLowerCase().includes(search.toLowerCase()) || r.motivo.toLowerCase().includes(search.toLowerCase()));
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blacklist Clienti</h1>
          <p className="text-gray-400 text-sm mt-0.5">{records.length} clienti in blacklist</p>
        </div>
        {canAdd && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all" style={{ backgroundColor: '#e8a020' }}>
            <Plus className="w-4 h-4" />
            Aggiungi Cliente
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome o motivo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessun cliente trovato.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-white">{r.nome_cliente}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/30 border border-red-700/40 text-red-400">Blacklist</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{r.motivo}</p>
                  {r.note && <p className="text-xs text-gray-500 mt-1">{r.note}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>{formatDate(r.data)}</span>
                    {r.aggiunto_da && <span>Aggiunto da: {fullName(r.aggiunto_da as Parameters<typeof fullName>[0])}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Record' : 'Aggiungi alla Blacklist'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome Cliente *</label>
              <input value={form.nome_cliente} onChange={e => setForm(f => ({ ...f, nome_cliente: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="Nome e Cognome" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Motivo *</label>
              <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
                placeholder="Motivo dell'inserimento in blacklist..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Note</label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
                placeholder="Note aggiuntive..." />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: '#e8a020' }}>
                {saving ? 'Salvataggio...' : editing ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Rimuovere questo cliente dalla blacklist?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Rimuovi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
