import { useEffect, useState, useRef } from 'react';
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconCar,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import PriceInput, { parsePrice } from '../../components/ui/PriceInput';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Veicolo, VeicoloStato, isAdmin, fullName } from '../../types';
import Modal from '../../components/ui/Modal';
import StarRating from '../../components/ui/StarRating';

const STATI: VeicoloStato[] = ['Da completare', 'Disponibile', 'In Trattativa', 'Venduto'];

/** Accept only https:// URLs — prevents javascript: or data: injection via DB tampering. */
function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

const statoBadge: Record<VeicoloStato, { bg: string; color: string }> = {
  'Da completare': { bg: 'rgba(255,140,0,0.15)', color: '#ff8c00' },
  Disponibile: { bg: 'rgba(76,175,80,0.15)', color: '#4caf50' },
  'In Trattativa': { bg: 'rgba(121,134,203,0.15)', color: '#7986cb' },
  Venduto: { bg: 'rgba(136,136,136,0.15)', color: '#888888' },
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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFotoFile(null);
    setFotoPreview(null);
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
    setFotoFile(null);
    setFotoPreview(v.foto_url || null);
    setError('');
    setModalOpen(true);
  }

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Tipo file non supportato. Usa JPG, PNG, WEBP o GIF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Il file supera il limite di 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError('');
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function clearFoto() {
    setFotoFile(null);
    setFotoPreview(null);
    setForm(f => ({ ...f, foto_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadFoto(file: File, vehicleId: string): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${vehicleId}.${ext}`;
    const { error } = await supabase.storage
      .from('vehicle-photos')
      .upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    setError('');
    if (!form.modello.trim() || !form.colore.trim()) {
      setError('Modello e colore sono obbligatori.');
      return;
    }
    setSaving(true);
    let foto_url = form.foto_url.trim() || null;

    if (editing) {
      if (fotoFile) {
        foto_url = await uploadFoto(fotoFile, editing.id) ?? foto_url;
      } else if (!fotoPreview) {
        foto_url = null;
      }
      const payload = {
        modello: form.modello.trim(),
        colore: form.colore.trim(),
        condizioni: form.condizioni,
        prezzo_acquisto: parsePrice(form.prezzo_acquisto),
        prezzo_vendita: form.prezzo_vendita ? parsePrice(form.prezzo_vendita) : null,
        trattabile: form.trattabile,
        modifiche: form.modifiche.trim() || null,
        foto_url,
        stato: form.stato,
        note: form.note.trim() || null,
      };
      await supabase.from('inventario').update(payload).eq('id', editing.id);
    } else {
      const { data: inserted } = await supabase
        .from('inventario')
        .insert({
          modello: form.modello.trim(),
          colore: form.colore.trim(),
          condizioni: form.condizioni,
          prezzo_acquisto: parsePrice(form.prezzo_acquisto),
          prezzo_vendita: form.prezzo_vendita ? parsePrice(form.prezzo_vendita) : null,
          trattabile: form.trattabile,
          modifiche: form.modifiche.trim() || null,
          foto_url: null,
          stato: form.stato,
          note: form.note.trim() || null,
          created_by: profile?.id,
        })
        .select()
        .single();
      if (inserted && fotoFile) {
        const uploadedUrl = await uploadFoto(fotoFile, inserted.id);
        if (uploadedUrl) {
          await supabase.from('inventario').update({ foto_url: uploadedUrl }).eq('id', inserted.id);
        }
      }
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

  const formatEuro = (n: number | null) =>
    n != null ? `$ ${n.toLocaleString('it-IT', { minimumFractionDigits: 0 })}` : '—';

  const counts = {
    disponibili: veicoli.filter(v => v.stato === 'Disponibile').length,
    trattativa: veicoli.filter(v => v.stato === 'In Trattativa').length,
    daCompletare: veicoli.filter(v => v.stato === 'Da completare').length,
    venduti: veicoli.filter(v => v.stato === 'Venduto').length,
  };

  const metricCards = [
    { label: 'Disponibili', value: counts.disponibili, color: '#4caf50' },
    { label: 'In Trattativa', value: counts.trattativa, color: '#e8a020' },
    { label: 'Da Completare', value: counts.daCompletare, color: '#ff8c00' },
    { label: 'Venduti', value: counts.venduti, color: '#7986cb' },
  ];

  const filterPills: Array<VeicoloStato | 'Tutti'> = ['Tutti', ...STATI];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Inventario</span>
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
            {veicoli.length} veicoli
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
          Aggiungi Veicolo
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {metricCards.map(m => (
          <div
            key={m.label}
            style={{
              backgroundColor: '#0f0f0f',
              border: '0.5px solid #e8a02033',
              borderRadius: '8px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 500, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <IconSearch size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per modello o colore..."
            style={{
              ...inputStyle,
              paddingLeft: '32px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterPills.map(pill => {
            const active = statoFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setStatoFilter(pill)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: active ? '#e8a02015' : 'transparent',
                  border: `0.5px solid ${active ? '#e8a02033' : '#1e1e1e'}`,
                  color: active ? '#e8a020' : '#555555',
                }}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555555', fontSize: '13px' }}>Nessun veicolo trovato.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(v => {
            const badge = statoBadge[v.stato];
            return (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#0f0f0f',
                  border: '0.5px solid #1e1e1e',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#e8a02044')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e1e')}
              >
                {/* Photo area */}
                <div
                  style={{
                    height: '160px',
                    backgroundColor: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {sanitizeImageUrl(v.foto_url) ? (
                    <img src={sanitizeImageUrl(v.foto_url)!} alt={v.modello} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <IconCar size={40} style={{ color: '#333333' }} />
                  )}
                  {/* Status badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `0.5px solid ${badge.color}44`,
                    }}
                  >
                    {v.stato}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>{v.modello}</div>
                    <div style={{ fontSize: '12px', color: '#888888', marginTop: '2px' }}>{v.colore}</div>
                  </div>

                  <StarRating value={v.condizioni} readonly />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: '#0a0a0a', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: '#555555', marginBottom: '3px' }}>Acquisto</div>
                      <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>{formatEuro(v.prezzo_acquisto)}</div>
                    </div>
                    <div style={{ backgroundColor: '#0a0a0a', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: '#555555', marginBottom: '3px' }}>Vendita</div>
                      <div style={{ fontSize: '13px', color: v.prezzo_vendita ? '#e8a020' : '#555555', fontWeight: 500 }}>
                        {formatEuro(v.prezzo_vendita)}
                        {v.prezzo_vendita && v.trattabile && (
                          <span style={{ fontSize: '10px', color: '#555555', marginLeft: '4px' }}>tratt.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {v.modifiche && (
                    <div style={{ fontSize: '12px', color: '#555555', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {v.modifiche}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '0.5px solid #1e1e1e' }}>
                    <span style={{ fontSize: '11px', color: '#555555' }}>
                      {v.profile ? fullName(v.profile as Parameters<typeof fullName>[0]) : ''}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => openEdit(v)}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                      >
                        <IconPencil size={14} />
                      </button>
                      {isAdmin(profile?.role) && (
                        <button
                          onClick={() => setDeleteConfirm(v.id)}
                          style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal title={editing ? 'Modifica Veicolo' : 'Nuovo Veicolo'} onClose={() => setModalOpen(false)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Modello <span style={{ color: '#e8a020' }}>*</span></label>
                <input
                  value={form.modello}
                  onChange={e => setForm(f => ({ ...f, modello: e.target.value }))}
                  style={inputStyle}
                  placeholder="es. BMW Serie 3"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
              </div>
              <div>
                <label style={labelStyle}>Colore <span style={{ color: '#e8a020' }}>*</span></label>
                <input
                  value={form.colore}
                  onChange={e => setForm(f => ({ ...f, colore: e.target.value }))}
                  style={inputStyle}
                  placeholder="es. Nero Metallizzato"
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Condizioni</label>
              <StarRating value={form.condizioni} onChange={v => setForm(f => ({ ...f, condizioni: v }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Prezzo Acquisto ($)</label>
                <PriceInput
                  value={form.prezzo_acquisto}
                  onChange={v => setForm(f => ({ ...f, prezzo_acquisto: v }))}
                  className=""
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Prezzo Vendita ($)</label>
                <PriceInput
                  value={form.prezzo_vendita}
                  onChange={v => setForm(f => ({ ...f, prezzo_vendita: v }))}
                  className=""
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Stato</label>
                <select
                  value={form.stato}
                  onChange={e => setForm(f => ({ ...f, stato: e.target.value as VeicoloStato }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
                <input
                  type="checkbox"
                  id="trattabile"
                  checked={form.trattabile}
                  onChange={e => setForm(f => ({ ...f, trattabile: e.target.checked }))}
                  style={{ width: '14px', height: '14px', accentColor: '#e8a020' }}
                />
                <label htmlFor="trattabile" style={{ fontSize: '13px', color: '#888888', cursor: 'pointer' }}>Prezzo Trattabile</label>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Foto Veicolo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {fotoPreview ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '160px', backgroundColor: '#141414' }}>
                  <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={clearFoto}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      padding: '4px', borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                      cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <IconX size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: '8px', right: '8px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '5px 10px', borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                      cursor: 'pointer', color: '#ffffff', fontSize: '12px',
                    }}
                  >
                    <IconUpload size={12} />
                    Cambia
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', height: '120px',
                    borderRadius: '8px', border: '0.5px dashed #2a2a2a',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                    backgroundColor: 'transparent', cursor: 'pointer', color: '#555555',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#555555'; (e.currentTarget as HTMLButtonElement).style.color = '#888888'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#555555'; }}
                >
                  <IconUpload size={20} />
                  <span style={{ fontSize: '12px' }}>Clicca per caricare una foto</span>
                  <span style={{ fontSize: '11px', color: '#444444' }}>JPG, PNG, WEBP fino a 5MB</span>
                </button>
              )}
            </div>

            <div>
              <label style={labelStyle}>Modifiche e Ritocchi</label>
              <textarea
                value={form.modifiche}
                onChange={e => setForm(f => ({ ...f, modifiche: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                placeholder="Descrivi le modifiche effettuate..."
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>

            <div>
              <label style={labelStyle}>Note</label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                placeholder="Note aggiuntive..."
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>

            {error && <div style={{ fontSize: '13px', color: '#f87171' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#e8a020', color: '#000000', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'none')}
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
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>
            Sei sicuro di voler eliminare questo veicolo? L'operazione non è reversibile.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setDeleteConfirm(null)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Annulla
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#dc2626')}
            >
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
