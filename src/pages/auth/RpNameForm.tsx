import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Car } from 'lucide-react';

export default function RpNameForm() {
  const { updateRpName } = useAuth();
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!nome.trim() || !cognome.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    setSaving(true);
    await updateRpName(nome.trim(), cognome.trim());
    setSaving(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#e8a020' }}>
              <Car className="w-8 h-8 text-black" />
            </div>
            <span className="text-3xl font-bold text-white tracking-wider">Sunrise Auto</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 p-8" style={{ backgroundColor: '#111111' }}>
          <h2 className="text-xl font-semibold text-white mb-2">Primo Accesso</h2>
          <p className="text-gray-400 text-sm mb-6">
            Inserisci il nome e cognome del tuo personaggio RP. Questi dati saranno visibili a tutti nell'applicazione.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome RP *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Cognome RP *</label>
                <input
                  type="text"
                  value={cognome}
                  onChange={e => setCognome(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="Rossi"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: '#e8a020' }}
            >
              {saving ? 'Salvataggio...' : 'Conferma'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
