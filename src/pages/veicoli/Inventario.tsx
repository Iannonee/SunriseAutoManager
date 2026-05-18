import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Image, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Veicolo, VeicoloStato, isAdmin, fullName } from '../../types';
import Modal from '../../components/ui/Modal';
import StarRating from '../../components/ui/StarRating';

const STATI: VeicoloStato[] = ['Da completare', 'Disponibile', 'In Trattativa', 'Venduto'];

const statoBadge: Record<VeicoloStato, { bg: string; text: string }> = {
  'Da completare': { bg: 'bg-orange-500/20 border border-orange-500/40', text: 'text-orange-400' },
  Disponibile: { bg: 'bg-green-500/20 border border-green-500/40', text: 'text-green-400' },
  'In Trattativa': { bg: 'bg-blue-500/20 border border-blue-500/40', text: 'text-blue-400' },
  Venduto: { bg: 'bg-gray-500/20 border border-gray-500/40', text: 'text-gray-400' },
};

const emptyForm = {
  modello: '',
  colore: '',
  condizioni: 3,
  prezzo_acquisto: '',
  prezzo_vendita: '',
  trattabile: false,
  modifiche: '',
  foto_url: '',
  stato: 'Disponibile' as VeicoloStato,
  note: '',
};

export default function Inventario() {
  const { profile } = useAuth();
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statoFilter, setStatoFilter] = useState<VeicoloStato | 'Tutti'>('Tutti');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Veicolo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchVeicoli(); }, []);

  async function fetchVeicoli() {
    setLoading(true);
    const { data } = await supabase
      .from('inventario')
      .select('*, profile:profiles!created_by(*)')
      .order('created_at', { ascending: false });
    setVeicoli(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(v: Veicolo) {
    setEditing(v);
    setForm({
      modello: v.modello,
      colore: v.colore,
      condizioni: v.condizioni,
      prezzo_acquisto: String(v.prezzo_acquisto),
      prezzo_vendita: v.prezzo_vendita != null ? String(v.prezzo_vendita) : '',
      trattabile: v.trattabile,
      modifiche: v.modifiche || '',
      foto_url: v.foto_url || '',
      stato: v.stato,
      note: v.note || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setError('');
    if (!form.modello.trim() || !form.colore.trim()) {
      setError('Modello e colore sono obbligatori.');
      return;
    }
    setSaving(true);
    const payload = {
      modello: form.modello.trim(),
      colore: form.colore.trim(),
      condizioni: form.condizioni,
      prezzo_acquisto: parseFloat(form.prezzo_acquisto) || 0,
      prezzo_vendita: form.prezzo_vendita ? parseFloat(form.prezzo_vendita) : null,
      trattabile: form.trattabile,
      modifiche: form.modifiche.trim() || null,
      foto_url: form.foto_url.trim() || null,
      stato: form.stato,
      note: form.note.trim() || null,
    };

    if (editing) {
      await supabase.from('inventario').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('inventario').insert({ ...payload, created_by: profile?.id });
    }

    await fetchVeicoli();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('inventario').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchVeicoli();
  }

  const filtered = veicoli.filter(v => {
    const matchSearch = v.modello.toLowerCase().includes(search.toLowerCase()) ||
      v.colore.toLowerCase().includes(search.toLowerCase());
    const matchStato = statoFilter === 'Tutti' || v.stato === statoFilter;
    return matchSearch && matchStato;
  });

  const formatEuro = (n: number | null) => n != null ? `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 0 })}` : '—';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-gray-400 text-sm mt-0.5">{veicoli.length} veicoli totali</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all"
          style={{ backgroundColor: '#e8a020' }}
        >
          <Plus className="w-4 h-4" />
          Aggiungi Veicolo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per modello o colore..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={statoFilter}
            onChange={e => setStatoFilter(e.target.value as VeicoloStato | 'Tutti')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 cursor-pointer"
          >
            <option value="Tutti">Tutti gli stati</option>
            {STATI.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessun veicolo trovato.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div
              key={v.id}
              className="rounded-2xl border border-gray-800 overflow-hidden transition-all hover:border-gray-700"
              style={{ backgroundColor: '#111111' }}
            >
              {/* Photo */}
              <div className="h-44 bg-gray-900 flex items-center justify-center overflow-hidden relative">
                {v.foto_url ? (
                  <img src={v.foto_url} alt={v.modello} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-gray-700" />
                )}
                {v.stato === 'Da completare' && (
                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white animate-pulse">
                    Da completare
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-base leading-tight">{v.modello}</h3>
                    <p className="text-gray-400 text-sm">{v.colore}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statoBadge[v.stato].bg} ${statoBadge[v.stato].text}`}>
                    {v.stato}
                  </span>
                </div>

                <StarRating value={v.condizioni} readonly />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                    <p className="text-gray-500 text-xs mb-0.5">Acquisto</p>
                    <p className="text-white font-medium">{formatEuro(v.prezzo_acquisto)}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                    <p className="text-gray-500 text-xs mb-0.5">Vendita</p>
                    <p className="font-medium" style={{ color: v.prezzo_vendita ? '#e8a020' : '#6b7280' }}>
                      {formatEuro(v.prezzo_vendita)}
                      {v.prezzo_vendita && v.trattabile && <span className="text-xs text-gray-500 ml-1">tratt.</span>}
                    </p>
                  </div>
                </div>

                {v.modifiche && (
                  <p className="text-xs text-gray-500 line-clamp-2">{v.modifiche}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-600">
                    {v.profile ? fullName(v.profile as Parameters<typeof fullName>[0]) : ''}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin(profile?.role) && (
                      <button
                        onClick={() => setDeleteConfirm(v.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal title={editing ? 'Modifica Veicolo' : 'Nuovo Veicolo'} onClose={() => setModalOpen(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Modello *</label>
                <input
                  value={form.modello}
                  onChange={e => setForm(f => ({ ...f, modello: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="es. BMW Serie 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Colore *</label>
                <input
                  value={form.colore}
                  onChange={e => setForm(f => ({ ...f, colore: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="es. Nero Metallizzato"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Condizioni</label>
              <StarRating value={form.condizioni} onChange={v => setForm(f => ({ ...f, condizioni: v }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Prezzo Vendita (€)</label>
                <input
                  type="number"
                  value={form.prezzo_vendita}
                  onChange={e => setForm(f => ({ ...f, prezzo_vendita: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Stato</label>
                <select
                  value={form.stato}
                  onChange={e => setForm(f => ({ ...f, stato: e.target.value as VeicoloStato }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="trattabile"
                  checked={form.trattabile}
                  onChange={e => setForm(f => ({ ...f, trattabile: e.target.checked }))}
                  className="w-4 h-4 accent-yellow-500"
                />
                <label htmlFor="trattabile" className="text-sm font-medium text-gray-300">Prezzo Trattabile</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Foto</label>
              <input
                value={form.foto_url}
                onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Modifiche e Ritocchi</label>
              <textarea
                value={form.modifiche}
                onChange={e => setForm(f => ({ ...f, modifiche: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
                placeholder="Descrivi le modifiche effettuate..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Note</label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
                placeholder="Note aggiuntive..."
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#e8a020' }}
              >
                {saving ? 'Salvataggio...' : editing ? 'Salva Modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Sei sicuro di voler eliminare questo veicolo? L'operazione non è reversibile.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5"
            >
              Annulla
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
