import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import PriceInput, { parsePrice } from '../../components/ui/PriceInput';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BilancioRecord, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bilancio</h1>
          <p className="text-gray-400 text-sm mt-0.5">Log finanziario giornaliero</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 transition-all" style={{ backgroundColor: '#e8a020' }}>
          <Plus className="w-4 h-4" />
          Nuovo Giorno
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-900/30"><TrendingUp className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-xs text-gray-500">Totale Incassato</p>
              <p className="text-lg font-bold text-green-400">{formatEuro(totalIncassato)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-900/30"><TrendingDown className="w-5 h-5 text-red-400" /></div>
            <div>
              <p className="text-xs text-gray-500">Totale Speso</p>
              <p className="text-lg font-bold text-red-400">{formatEuro(totalSpeso)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#e8a02020' }}><DollarSign className="w-5 h-5" style={{ color: '#e8a020' }} /></div>
            <div>
              <p className="text-xs text-gray-500">Saldo Totale</p>
              <p className={`text-lg font-bold ${totalSaldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatEuro(totalSaldo)}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nessun record registrato.</div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-white">{formatDate(r.data)}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.saldo_giornaliero >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      Saldo: {formatEuro(r.saldo_giornaliero)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                      <p className="text-gray-500 text-xs mb-0.5">Veicoli Acquistati</p>
                      <p className="text-white font-medium">{r.veicoli_acquistati}</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                      <p className="text-gray-500 text-xs mb-0.5">Totale Speso</p>
                      <p className="text-red-400 font-medium">{formatEuro(r.totale_speso)}</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                      <p className="text-gray-500 text-xs mb-0.5">Veicoli Venduti</p>
                      <p className="text-white font-medium">{r.veicoli_venduti}</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0a0a' }}>
                      <p className="text-gray-500 text-xs mb-0.5">Totale Incassato</p>
                      <p className="text-green-400 font-medium">{formatEuro(r.totale_incassato)}</p>
                    </div>
                  </div>
                  {r.note && <p className="text-xs text-gray-500 mt-2">{r.note}</p>}
                  <p className="text-xs text-gray-600 mt-2">
                    Compilato da: {r.compilato_da ? fullName(r.compilato_da as Parameters<typeof fullName>[0]) : '—'}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Modifica Giorno' : 'Nuovo Giorno'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Veicoli Acquistati</label>
                <input type="number" value={form.veicoli_acquistati} onChange={e => setForm(f => ({ ...f, veicoli_acquistati: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Totale Speso ($)</label>
                <PriceInput value={form.totale_speso} onChange={v => setForm(f => ({ ...f, totale_speso: v }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Veicoli Venduti</label>
                <input type="number" value={form.veicoli_venduti} onChange={e => setForm(f => ({ ...f, veicoli_venduti: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Totale Incassato ($)</label>
                <PriceInput value={form.totale_incassato} onChange={v => setForm(f => ({ ...f, totale_incassato: v }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0a0a' }}>
              <p className="text-gray-400 text-sm">
                Saldo giornaliero: <span className={`font-semibold ${parsePrice(form.totale_incassato) - parsePrice(form.totale_speso) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {`$ ${(parsePrice(form.totale_incassato) - parsePrice(form.totale_speso)).toLocaleString('it-IT')}`}
                </span>
              </p>
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
          <p className="text-gray-300 mb-6">Eliminare questo record di bilancio?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
