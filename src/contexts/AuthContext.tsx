import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

type AuthState = 'loading' | 'no-profile' | 'needs-rp-name' | 'needs-role' | 'disabled' | 'ready';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authState: AuthState;
  loading: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateRpName: (nome: string, cognome: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  function deriveAuthState(p: Profile | null): AuthState {
    if (!p) return 'no-profile';
    if (!p.is_active) return 'disabled';
    if (!p.nome || !p.cognome) return 'needs-rp-name';
    if (!p.role) return 'needs-role';
    return 'ready';
  }

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!data) {
      // Auth user exists but profile was deleted — recreate it so the user
      // doesn't get stuck in a login loop.
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .single();

      if (error) {
        // Likely a race condition (getSession + onAuthStateChange both fired).
        // The other call already inserted the row — just fetch it.
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        setProfile(existing);
        return existing;
      }

      setProfile(created);
      return created;
    }

    setProfile(data);
    return data;
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  async function updateRpName(nome: string, cognome: string) {
    if (!user) return;
    await supabase.from('profiles').update({ nome, cognome }).eq('id', user.id);
    await fetchProfile(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const authState = loading ? 'loading' : deriveAuthState(profile);

  return (
    <AuthContext.Provider value={{ user, session, profile, authState, loading, signInWithDiscord, signOut, refreshProfile, updateRpName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
