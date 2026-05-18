import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { VeicoloVenduto, Veicolo, Profile, canEditVeicoliVenduti, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

export default function VeicoliVenduti() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<VeicoloVenduto[]>([]);
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VeicoloVenduto | null>(null);
  const [form, setForm] = useState({
    veicolo_id: '',
    prezzo_vendita_finale: '',
    acquirente: '',
    dipendente_id: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canEdit = canEditVeicoliVenduti(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [rec, vei, prof] = await Promise.all([
      supabase.from('veicoli_venduti').select('*, veicolo:inventario(*), dipendente:profiles!dipendente_id(*), creator:profiles!created_by(*)').order('created_at', { ascending: false }),
      supabase.from('inventario').select('*').in('stato', ['Disponibile', 'In Trattativa']).order('modello'),
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
    ]);
    setRecords(rec.data || []);
    setVeicoli(vei.data || []);
    setProfiles(prof.data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      veicolo_id: '',
      prezzo_vendita_finale: '',
      acquirente: '',
      dipendente_id: profile?.id || '',
      data: new Date().toISOString().split('T')[0],
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: VeicoloVenduto) {
    setEditing(r);
    setForm({
      veicolo_id: r.veicolo_id || '',
      prezzo_vendita_finale: String(r.prezzo_vendita_finale),
      acquirente: r.acquirente,
      dipendente_id: r.dipendente_id || '',
      data: r.data,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!editing && !form.veicolo_id) {
      setError('Seleziona un veicolo.');
      return;
    }
    if (!form.acquirente.trim()) {
      setError("L'acquirente è obbligatorio.");
      return;
    }
    setSaving(true);

    if (editing) {
      await supabase.from('veicoli_venduti').update({
        prezzo_vendita_finale: parseFloat(form.prezzo_vendita_finale) || 0,
        acquirente: form.acquirente.trim(),
        dipendente_id: form.dipendente_id || null,
        data: form.data,
      }).eq('id', editing.id);
    } else {
      await supabase.from('veicoli_venduti').insert({
        veicolo_id: form.veicolo_id,
        prezzo_vendita_finale: parseFloat(form.prezzo_vendita_finale) || 0,
        acquirente: form.acquirente.trim(),
        dipendente_id: form.dipendente_id || null,
        data: form.data,
        created_by: profile?.id,
      });

      // Update vehicle status to Venduto
      await supabase.from('inventario').update({ stato: 'Venduto' }).eq('id', form.veicolo_id);
    }

    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('veicoli_venduti').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const formatEuro = (n: number) => `$ ${n.toLocaleString('it-IT')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Veicoli Venduti</h1>
          <p className="text-gray-400 text-sm mt-0.5">{records.length} vendite registrate</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all"
          style={{ backgroundColor: '#e8a020' }}
        >
          <Plus className="w-4 h-4" />
          Registra Vendita
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessuna vendita registrata.</div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Modello</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Prezzo Vendita</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Acquirente</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Dipendente</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Aggiunto Da</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gray-800/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="px-4 py-3 text-white font-medium">{r.veicolo?.modello || '—'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#e8a020' }}>{formatEuro(r.prezzo_vendita_finale)}</td>
                    <td className="px-4 py-3 text-gray-300">{r.acquirente}</td>
                    <td className="px-4 py-3 text-gray-300">{r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(r.data)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.creator ? fullName(r.creator as Parameters<typeof fullName>[0]) : '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
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
        <Modal title={editing ? 'Modifica Vendita' : 'Registra Vendita'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Veicolo *</label>
                <select
                  value={form.veicolo_id}
                  onChange={e => setForm(f => ({ ...f, veicolo_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Seleziona veicolo...</option>
                  {veicoli.map(v => (
                    <option key={v.id} value={v.id}>{v.modello} — {v.colore} ({v.stato})</option>
                  ))}
                </select>
                {veicoli.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Nessun veicolo disponibile o in trattativa.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prezzo di Vendita Finale ($)</label>
              <input
                type="number"
                value={form.prezzo_vendita_finale}
                onChange={e => setForm(f => ({ ...f, prezzo_vendita_finale: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Acquirente *</label>
              <input
                value={form.acquirente}
                onChange={e => setForm(f => ({ ...f, acquirente: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="Nome acquirente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Dipendente</label>
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
                {saving ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Registra Vendita'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Eliminare questo record di vendita?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
