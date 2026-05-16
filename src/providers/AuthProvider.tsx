import { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContext, User, UserRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role
  const fetchUserData = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, is_active')
        .eq('id', userId)
        .single();

      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      const role = (roleData as UserRole) || 'viewer';

      if (profile && profile.is_active !== false) {
        setUser({
          id: userId,
          name: profile.name || email.split('@')[0],
          email,
          role,
          token: '',
        });
      } else {
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    let lastUserId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const nextUserId = session?.user?.id ?? null;

        if (!nextUserId) {
          lastUserId = null;
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Skip refetch on token refresh / repeated events for same user
        if (nextUserId === lastUserId) {
          setIsLoading(false);
          return;
        }
        lastUserId = nextUserId;

        setIsLoading(true);
        setTimeout(() => {
          fetchUserData(session!.user.id, session!.user.email || '');
        }, 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (lastUserId !== session.user.id) {
          lastUserId = session.user.id;
          fetchUserData(session.user.id, session.user.email || '');
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Login function (kept for compatibility, but Supabase handles this)
  const login = useCallback(async (_token: string) => {
    // This is handled by Supabase auth state change
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user.id, session.user.email || '');
    }
  }, [fetchUserData]);

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
