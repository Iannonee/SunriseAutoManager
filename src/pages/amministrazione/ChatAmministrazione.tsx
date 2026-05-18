import { useEffect, useState, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ChatAdminMessage, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

export default function ChatAmministrazione() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatAdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('chat_admin')
      .select('*, mittente:profiles!mittente_id(*)')
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    await supabase.from('chat_admin').insert({ messaggio: text.trim(), mittente_id: profile?.id });
    setText('');
    await fetchMessages();
    setSending(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('chat_admin').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchMessages();
  }

  const formatTime = (d: string) => new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 md:p-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-white">Chat Amministrazione</h1>
        <p className="text-gray-400 text-sm mt-0.5">Chat privata — solo Direzione</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-800 p-4 space-y-3 mb-4" style={{ backgroundColor: '#111111' }}>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Caricamento...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nessun messaggio ancora.</div>
        ) : (
          messages.map(m => {
            const isMe = m.mittente_id === profile?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-xs text-gray-500 px-1">
                      {m.mittente ? fullName(m.mittente as Parameters<typeof fullName>[0]) : 'Sconosciuto'}
                      {m.mittente && <span className="ml-1" style={{ color: '#e8a020' }}>· {(m.mittente as Parameters<typeof fullName>[0]).role}</span>}
                    </span>
                  )}
                  <div className="flex items-start gap-2">
                    {isMe && (
                      <button onClick={() => setDeleteConfirm(m.id)} className="p-1 rounded text-gray-700 hover:text-red-400 transition-colors shrink-0 mt-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'rounded-br-sm text-black' : 'rounded-bl-sm text-white border border-gray-700'}`}
                      style={isMe ? { backgroundColor: '#e8a020' } : { backgroundColor: '#1a1a1a' }}
                    >
                      {m.messaggio}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 px-1">{formatTime(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3 shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Scrivi un messaggio privato..."
          className="flex-1 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-4 py-3 rounded-xl font-semibold text-black hover:brightness-110 disabled:opacity-50 transition-all"
          style={{ backgroundColor: '#e8a020' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {deleteConfirm && (
        <Modal title="Elimina Messaggio" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 mb-6">Eliminare questo messaggio?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm">Annulla</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
