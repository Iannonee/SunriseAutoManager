import { useAuth } from '../../contexts/AuthContext';
import { Car, Clock } from 'lucide-react';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md px-4 text-center">
        <div className="rounded-2xl border border-gray-800 p-8" style={{ backgroundColor: '#111111' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e8a02020' }}>
            <Clock className="w-8 h-8" style={{ color: '#e8a020' }} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Accesso in attesa di approvazione</h2>
          <p className="text-gray-400 text-sm mb-6">
            Il tuo account e stato registrato con successo. Un amministratore deve assegnarti un ruolo prima che tu possa accedere all'applicazione.
          </p>
          {profile?.discord_username && (
            <p className="text-xs text-gray-600 mb-6">
              Account Discord: <span className="text-gray-400">{profile.discord_username}</span>
            </p>
          )}
          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl font-semibold text-black hover:brightness-110 transition-all"
            style={{ backgroundColor: '#e8a020' }}
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
