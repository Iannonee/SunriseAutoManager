import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AutoAcquistata, Profile, isAdmin, canEditAutoAcquistate, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

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
      prezzo_acquisto: parseFloat(form.prezzo_acquisto) || 0,
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
        prezzo_acquisto: parseFloat(form.prezzo_acquisto) || 0,
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

  const formatEuro = (n: number) => `€ ${n.toLocaleString('it-IT')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT');
  const canEdit = canEditAutoAcquistate(profile?.role);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auto Acquistate</h1>
          <p className="text-gray-400 text-sm mt-0.5">{records.length} acquisti registrati</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all"
          style={{ backgroundColor: '#e8a020' }}
        >
          <Plus className="w-4 h-4" />
          Nuovo Acquisto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessun acquisto registrato.</div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Modello</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Colore</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Prezzo Acquisto</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Venduto Da</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Dipendente</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Aggiunto Da</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gray-800/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="px-4 py-3 text-white font-medium">{r.modello}</td>
                    <td className="px-4 py-3 text-gray-300">{r.colore}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#e8a020' }}>{formatEuro(r.prezzo_acquisto)}</td>
                    <td className="px-4 py-3 text-gray-300">{r.venduto_da}</td>
                    <td className="px-4 py-3 text-gray-300">{r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(r.data)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.creator ? fullName(r.creator as Parameters<typeof fullName>[0]) : '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(r.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Modello *</label>
                <input
                  value={form.modello}
                  onChange={e => setForm(f => ({ ...f, modello: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="es. Audi A4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Colore *</label>
                <input
                  value={form.colore}
                  onChange={e => setForm(f => ({ ...f, colore: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="es. Grigio"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prezzo Acquisto (€)</label>
              <input
                type="number"
                value={form.prezzo_acquisto}
                onChange={e => setForm(f => ({ ...f, prezzo_acquisto: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Venduto Da (nome/contatto) *</label>
              <input
                value={form.venduto_da}
                onChange={e => setForm(f => ({ ...f, venduto_da: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="es. Giuseppe Bianchi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Dipendente che ha gestito</label>
              <select
                value={form.dipendente_id}
                onChange={e => setForm(f => ({ ...f, dipendente_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                <option value="">Seleziona dipendente</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{fullName(p)} — {p.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5">Annulla</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: '#e8a020' }}
              >
                {saving ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Registra Acquisto'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Eliminare questo record?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
