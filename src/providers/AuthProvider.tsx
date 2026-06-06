import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, User, UserRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);
  const loadingUserIdRef = useRef<string | null>(null);
  const fetchVersionRef = useRef(0);

  // Fetch user profile and role
  const applySession = useCallback(async (session: Session | null) => {
    const nextUserId = session?.user?.id ?? null;

    if (!nextUserId) {
      fetchVersionRef.current += 1;
      activeUserIdRef.current = null;
      loadingUserIdRef.current = null;
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (nextUserId === activeUserIdRef.current) {
      setIsLoading(false);
      return;
    }

    if (nextUserId === loadingUserIdRef.current) {
      return;
    }

    const fetchVersion = fetchVersionRef.current + 1;
    fetchVersionRef.current = fetchVersion;
    loadingUserIdRef.current = nextUserId;
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, is_active')
        .eq('id', nextUserId)
        .single();

      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: nextUserId });

      const role = (roleData as UserRole) || 'viewer';

      if (fetchVersion !== fetchVersionRef.current) {
        return;
      }

      if (profile && profile.is_active !== false) {
        activeUserIdRef.current = nextUserId;
        setUser({
          id: nextUserId,
          name: profile.name || (session.user.email || '').split('@')[0],
          email: session.user.email || '',
          role,
          token: '',
        });
      } else {
        activeUserIdRef.current = null;
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (fetchVersion === fetchVersionRef.current) {
        activeUserIdRef.current = null;
        setUser(null);
      }
    } finally {
      if (fetchVersion === fetchVersionRef.current) {
        loadingUserIdRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void applySession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [applySession]);

  // Login function (kept for compatibility, but Supabase handles this)
  const login = useCallback(async (_token: string) => {
    // This is handled by Supabase auth state change
    const { data: { session } } = await supabase.auth.getSession();
    await applySession(session);
  }, [applySession]);

  // Logout function
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
