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
    if (!p.role && !p.ruolo_fazione) return 'needs-role';
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
    // Sanitise: strip leading/trailing whitespace and enforce max length (matches DB constraint).
    const safeName = nome.trim().slice(0, 100);
    const safeCognome = cognome.trim().slice(0, 100);
    if (!safeName || !safeCognome) return;
    await supabase.from('profiles').update({ nome: safeName, cognome: safeCognome }).eq('id', user.id);
    await fetchProfile(user.id);
  }

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          if (mounted) setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Supabase's automatic hash detection can race with the INITIAL_SESSION event.
    // When landing from an OAuth redirect (#access_token= in URL) we explicitly
    // parse the token and call setSession so the SIGNED_IN event fires reliably,
    // regardless of whether the automatic detection won the race or not.
    const hash = window.location.hash.slice(1);
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token') ?? '';
      if (access_token) {
        supabase.auth.setSession({ access_token, refresh_token }).catch(() => {
          // Token invalid/expired — let loading stay until onAuthStateChange resolves
          if (mounted) setLoading(false);
        });
      }
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    // Clear local state immediately so the UI transitions to logged-out
    // even if the Supabase network call is slow or fails.
    setUser(null);
    setSession(null);
    setProfile(null);
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
