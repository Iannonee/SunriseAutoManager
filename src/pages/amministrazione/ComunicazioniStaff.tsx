import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ComunicazioneStaff, ComunicazioneStaffTipo, Profile, ROLES, canWriteComunicazioniStaff, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

const TIPI: ComunicazioneStaffTipo[] = ['Promozione', 'Retrocessione', 'Richiamo Verbale', 'Richiamo Ufficiale', 'Retrocessione Disciplinare', 'Espulsione'];

const tipoStyle: Record<ComunicazioneStaffTipo, { bg: string; text: string }> = {
  Promozione: { bg: 'bg-green-900/30 border border-green-700/40', text: 'text-green-400' },
  Retrocessione: { bg: 'bg-orange-900/30 border border-orange-700/40', text: 'text-orange-400' },
  'Richiamo Verbale': { bg: 'bg-yellow-900/30 border border-yellow-700/40', text: 'text-yellow-400' },
  'Richiamo Ufficiale': { bg: 'bg-orange-900/30 border border-orange-700/40', text: 'text-orange-500' },
  'Retrocessione Disciplinare': { bg: 'bg-red-900/30 border border-red-700/40', text: 'text-red-400' },
  Espulsione: { bg: 'bg-red-900/50 border border-red-600/60', text: 'text-red-300' },
};

export default function ComunicazioniStaff() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<ComunicazioneStaff[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ tipo: ComunicazioneStaffTipo; dipendente_id: string; da_ruolo: string; a_ruolo: string; data: string; motivazione: string }>({
    tipo: 'Richiamo Verbale', dipendente_id: '', da_ruolo: '', a_ruolo: '',
    data: new Date().toISOString().split('T')[0], motivazione: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canWrite = canWriteComunicazioniStaff(profile?.role);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [rec, prof] = await Promise.all([
      supabase.from('comunicazioni_staff').select('*, dipendente:profiles!dipendente_id(*), creator:profiles!created_by(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_active', true).order('cognome'),
    ]);
    setRecords(rec.data || []);
    setProfiles(prof.data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm({ tipo: 'Richiamo Verbale', dipendente_id: '', da_ruolo: '', a_ruolo: '', data: new Date().toISOString().split('T')[0], motivazione: '' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.dipendente_id || !form.motivazione.trim()) { setError('Dipendente e motivazione obbligatori.'); return; }
    setSaving(true);
    const showRoles = form.tipo === 'Promozione' || form.tipo === 'Retrocessione';
    await supabase.from('comunicazioni_staff').insert({
      tipo: form.tipo,
      dipendente_id: form.dipendente_id,
      da_ruolo: showRoles ? form.da_ruolo || null : null,
      a_ruolo: showRoles ? form.a_ruolo || null : null,
      data: form.data,
      motivazione: form.motivazione.trim(),
      created_by: profile?.id,
    });
    await fetchAll();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('comunicazioni_staff').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comunicazioni Staff</h1>
          <p className="text-gray-400 text-sm mt-0.5">Bacheca ufficiale della direzione</p>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all" style={{ backgroundColor: '#e8a020' }}>
            <Plus className="w-4 h-4" />
            Nuova Comunicazione
          </button>
        )}
      </div>

      {!canWrite && (
        <div className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-400" style={{ backgroundColor: '#111111' }}>
          Solo la direzione puo pubblicare comunicazioni. Tu puoi solo consultare.
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessuna comunicazione registrata.</div>
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const style = tipoStyle[r.tipo];
            return (
              <div key={r.id} className="rounded-2xl border border-gray-800 p-5" style={{ backgroundColor: '#111111' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>{r.tipo}</span>
                      <span className="text-white font-semibold">
                        {r.dipendente ? fullName(r.dipendente as Parameters<typeof fullName>[0]) : '—'}
                      </span>
                      {r.da_ruolo && r.a_ruolo && (
                        <span className="text-xs text-gray-400">
                          <span className="text-gray-500">{r.da_ruolo}</span>
                          <span className="mx-1.5">→</span>
                          <span style={{ color: '#e8a020' }}>{r.a_ruolo}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{r.motivazione}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>{formatDate(r.data)}</span>
                      {r.creator && <span>Da: {fullName(r.creator as Parameters<typeof fullName>[0])}</span>}
                    </div>
                  </div>
                  {canWrite && (
                    <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title="Nuova Comunicazione" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as ComunicazioneStaffTipo }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500">
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Dipendente *</label>
              <select value={form.dipendente_id} onChange={e => setForm(f => ({ ...f, dipendente_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500">
                <option value="">Seleziona dipendente</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{fullName(p)} — {p.role}</option>)}
              </select>
            </div>
            {(form.tipo === 'Promozione' || form.tipo === 'Retrocessione') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Da Ruolo</label>
                  <select value={form.da_ruolo} onChange={e => setForm(f => ({ ...f, da_ruolo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500">
                    <option value="">Seleziona</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">A Ruolo</label>
                  <select value={form.a_ruolo} onChange={e => setForm(f => ({ ...f, a_ruolo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500">
                    <option value="">Seleziona</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Motivazione *</label>
              <textarea value={form.motivazione} onChange={e => setForm(f => ({ ...f, motivazione: e.target.value }))} rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
                placeholder="Motivazione della comunicazione..." />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: '#e8a020' }}>
                {saving ? 'Invio...' : 'Pubblica'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Eliminare questa comunicazione?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
