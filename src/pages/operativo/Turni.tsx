import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Turno, Profile, isAdmin, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

export default function Turni() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<Turno[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turno | null>(null);
  const [form, setForm] = useState({
    dipendente_id: '',
    data: new Date().toISOString().split('T')[0],
    ora_inizio: '09:00',
    ora_fine: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const admin = isAdmin(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [profRes, recRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
      // RLS handles filtering: non-admins only see their own turni
      supabase.from('turni').select('*, dipendente:profiles!dipendente_id(*)').order('data', { ascending: false }),
    ]);
    setProfiles(profRes.data || []);
    setRecords(recRes.data || []);
    setLoading(false);
  }

  function calcOre(inizio: string, fine: string): number {
    const [ih, im] = inizio.split(':').map(Number);
    const [fh, fm] = fine.split(':').map(Number);
    const totalMin = (fh * 60 + fm) - (ih * 60 + im);
    return Math.max(0, parseFloat((totalMin / 60).toFixed(2)));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      dipendente_id: profile?.id || '',
      data: new Date().toISOString().split('T')[0],
      ora_inizio: '09:00',
      ora_fine: '18:00',
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(t: Turno) {
    setEditing(t);
    setForm({
      dipendente_id: t.dipendente_id || '',
      data: t.data,
      ora_inizio: t.ora_inizio,
      ora_fine: t.ora_fine,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.dipendente_id) { setError('Seleziona un dipendente.'); return; }
    if (form.ora_fine <= form.ora_inizio) { setError("L'ora di fine deve essere successiva all'ora di inizio."); return; }

    // Non-admins can only create/edit their own turni
    if (!admin && form.dipendente_id !== profile?.id) {
      setError('Puoi inserire solo il tuo turno.');
      return;
    }

    setSaving(true);
    const payload = {
      dipendente_id: form.dipendente_id,
      data: form.data,
      ora_inizio: form.ora_inizio,
      ora_fine: form.ora_fine,
      ore_totali: calcOre(form.ora_inizio, form.ora_fine),
    };

    if (editing) {
      await supabase.from('turni').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('turni').insert({ ...payload, created_by: profile?.id });
    }
    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('turni').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

  function canEditTurno(t: Turno): boolean {
    if (admin) return true;
    return t.created_by === profile?.id;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Turni</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {admin ? `${records.length} turni registrati (tutti)` : 'I tuoi turni'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all"
          style={{ backgroundColor: '#e8a020' }}
        >
          <Plus className="w-4 h-4" />
          Aggiungi Turno
        </button>
      </div>

      {!admin && (
        <div className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-400" style={{ backgroundColor: '#111111' }}>
          Puoi visualizzare e modificare solo i tuoi turni. La direzione puo vedere tutti i turni.
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessun turno registrato.</div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Dipendente</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Inizio</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Fine</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Ore Totali</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const editable = canEditTurno(r);
                  return (
                    <tr key={r.id} className={`border-b border-gray-800/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 text-white font-medium">{r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}</td>
                      <td className="px-4 py-3 text-gray-300">{formatDate(r.data)}</td>
                      <td className="px-4 py-3 text-gray-300">{r.ora_inizio.slice(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-300">{r.ora_fine.slice(0, 5)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#e8a02020', color: '#e8a020' }}>
                          {r.ore_totali}h
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {editable && (
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {admin && (
                            <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Turno' : 'Aggiungi Turno'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Dipendente</label>
              {admin ? (
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
              ) : (
                <div className="px-3 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm">
                  {profile ? `${fullName(profile)} (tu)` : '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ora Inizio</label>
                <input type="time" value={form.ora_inizio} onChange={e => setForm(f => ({ ...f, ora_inizio: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ora Fine</label>
                <input type="time" value={form.ora_fine} onChange={e => setForm(f => ({ ...f, ora_fine: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0a0a' }}>
              <p className="text-gray-400 text-sm">
                Ore calcolate: <span className="font-semibold text-white">{calcOre(form.ora_inizio, form.ora_fine)}h</span>
              </p>
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
          <p className="text-gray-300 mb-6">Eliminare questo turno?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
