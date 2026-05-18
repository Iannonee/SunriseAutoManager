import { useEffect, useState, useRef } from 'react';
import { IconSend, IconTrash } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Comunicazione, canDeleteComunicazioni, fullName } from '../../types';
import Modal from '../../components/ui/Modal';

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#e8a02015',
        border: '0.5px solid #e8a02033',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#e8a020',
        flexShrink: 0,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  );
}

export default function Comunicazioni() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Comunicazione[]>([]);
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
      .from('comunicazioni')
      .select('*, autore:profiles!autore_id(*)')
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    await supabase.from('comunicazioni').insert({ testo: text.trim(), autore_id: profile?.id });
    setText('');
    await fetchMessages();
    setSending(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('comunicazioni').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchMessages();
  }

  const formatTime = (d: string) =>
    new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 52px)',
        boxSizing: 'border-box',
        gap: '16px',
      }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '16px',
          backgroundColor: '#0f0f0f',
          border: '0.5px solid #1e1e1e',
          borderRadius: '12px',
          minHeight: 0,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#555555', fontSize: '13px' }}>Caricamento...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#555555', fontSize: '13px' }}>Nessun messaggio ancora. Scrivi il primo!</div>
        ) : (
          messages.map(m => {
            const isMe = m.autore_id === profile?.id;
            const canDel = canDeleteComunicazioni(profile?.role, m.autore_id, profile?.id ?? null);
            const authorName = m.autore ? fullName(m.autore as Parameters<typeof fullName>[0]) : 'Sconosciuto';
            return (
              <div
                key={m.id}
                style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
              >
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                      <Avatar name={authorName} />
                      <span style={{ fontSize: '11px', color: '#555555' }}>
                        {authorName}
                        {m.autore && (
                          <span style={{ color: '#e8a020', marginLeft: '6px' }}>
                            · {(m.autore as Parameters<typeof fullName>[0]).role}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        fontSize: '13px',
                        ...(isMe
                          ? { backgroundColor: '#e8a02015', border: '0.5px solid #e8a02033', color: '#ffffff' }
                          : { backgroundColor: '#0f0f0f', border: '0.5px solid #1e1e1e', color: '#ffffff' }),
                      }}
                    >
                      {m.testo}
                    </div>
                    {canDel && (
                      <button
                        onClick={() => setDeleteConfirm(m.id)}
                        style={{ padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555555', marginTop: '4px', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
                      >
                        <IconTrash size={12} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#444444', padding: '0 4px' }}>{formatTime(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Scrivi un messaggio..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#0a0a0a',
            border: '0.5px solid #2a2a2a',
            color: '#ffffff',
            fontSize: '13px',
            outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a02066')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: '#e8a020',
            border: 'none',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: sending || !text.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => { if (!sending && text.trim()) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'none')}
        >
          <IconSend size={16} style={{ color: '#000000' }} />
        </button>
      </div>

      {deleteConfirm && (
        <Modal title="Elimina Messaggio" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#888888', fontSize: '13px', marginBottom: '20px' }}>Eliminare questo messaggio?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '0.5px solid #2a2a2a', backgroundColor: 'transparent', color: '#888888', fontSize: '13px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffffff08')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Annulla
            </button>
            <button onClick={() => handleDelete(deleteConfirm)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#dc2626')}>
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
