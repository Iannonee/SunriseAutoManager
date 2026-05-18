import { useEffect, useState } from 'react';
import { Pencil, UserX, UserCheck, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile, UserRole, ROLES, fullName, isAdmin } from '../../types';
import Modal from '../../components/ui/Modal';

export default function PannelloAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Venditore');
  const [saving, setSaving] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<Profile | null>(null);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('cognome');
    setProfiles(data || []);
    setLoading(false);
  }

  function openEdit(p: Profile) {
    setEditingUser(p);
    setEditRole((p.role && ROLES.includes(p.role as UserRole)) ? p.role as UserRole : 'Venditore');
  }

  async function handleSaveRole() {
    if (!editingUser) return;
    setSaving(true);
    await supabase.from('profiles').update({ role: editRole }).eq('id', editingUser.id);
    await fetchProfiles();
    setEditingUser(null);
    setSaving(false);
  }

  async function handleToggleActive(p: Profile) {
    await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id);
    setToggleConfirm(null);
    fetchProfiles();
  }

  const roleBadgeColor: Record<string, string> = {
    Direttrice: '#e8a020',
    'Vice Direttore': '#c87d10',
    'Responsabile Vendite': '#3b82f6',
    'Venditore Senior': '#22c55e',
    Venditore: '#6b7280',
    Stagista: '#4b5563',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: '#e8a02020' }}>
          <Shield className="w-5 h-5" style={{ color: '#e8a020' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pannello Amministratore</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestione utenti e ruoli</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <p className="text-2xl font-bold text-white">{profiles.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Utenti totali</p>
        </div>
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <p className="text-2xl font-bold text-green-400">{profiles.filter(p => p.is_active && p.role).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Account attivi</p>
        </div>
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <p className="text-2xl font-bold" style={{ color: '#e8a020' }}>{profiles.filter(p => !p.role).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">In attesa di ruolo</p>
        </div>
        <div className="rounded-2xl border border-gray-800 p-4" style={{ backgroundColor: '#111111' }}>
          <p className="text-2xl font-bold text-red-400">{profiles.filter(p => !p.is_active).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Account disattivati</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Caricamento...</div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome RP</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Cognome RP</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Discord</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Ruolo</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Stato</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => {
                  const hasAssignedRole = p.role && ROLES.includes(p.role as UserRole);
                  const badgeColor = hasAssignedRole ? (roleBadgeColor[p.role] || '#4b5563') : '#4b5563';
                  return (
                    <tr key={p.id} className={`border-b border-gray-800/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {p.nome ? p.nome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className={`font-medium ${p.is_active ? 'text-white' : 'text-gray-500'}`}>
                            {p.nome || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{p.cognome || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.discord_username || '—'}</td>
                      <td className="px-4 py-3">
                        {hasAssignedRole ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
                          >
                            {p.role}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/40">
                            Senza ruolo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                          {p.is_active ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Modifica ruolo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setToggleConfirm(p)}
                            className={`p-1.5 rounded-lg transition-colors ${p.is_active ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/20'}`}
                            title={p.is_active ? 'Disattiva account' : 'Riattiva account'}
                          >
                            {p.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
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

      {editingUser && (
        <Modal title={`Modifica Ruolo — ${fullName(editingUser)}`} onClose={() => setEditingUser(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome RP</label>
              <div className="px-3 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm">{editingUser.nome || '—'} {editingUser.cognome || ''}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Discord</label>
              <div className="px-3 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm">{editingUser.discord_username || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ruolo attuale</label>
              <div className="px-3 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm">{editingUser.role || 'Nessun ruolo assegnato'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nuovo Ruolo</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-white/5">Annulla</button>
              <button onClick={handleSaveRole} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-black text-sm hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: '#e8a020' }}>
                {saving ? 'Salvataggio...' : 'Assegna Ruolo'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toggleConfirm && (
        <Modal title={toggleConfirm.is_active ? 'Disattiva Account' : 'Riattiva Account'} onClose={() => setToggleConfirm(null)}>
          <p className="text-gray-300 mb-6">
            {toggleConfirm.is_active
              ? `Disattivare l'account di ${fullName(toggleConfirm)}? L'utente non potrà più accedere.`
              : `Riattivare l'account di ${fullName(toggleConfirm)}?`}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setToggleConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button
              onClick={() => handleToggleActive(toggleConfirm)}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${toggleConfirm.is_active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
            >
              {toggleConfirm.is_active ? 'Disattiva' : 'Riattiva'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
