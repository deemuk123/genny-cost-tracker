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
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, is_active')
        .eq('id', userId)
        .single();

      // Get role using the database function
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      const role = (roleData as UserRole) || 'viewer';
      
      if (profile && profile.is_active !== false) {
        setUser({
          id: userId,
          name: profile.name || email.split('@')[0],
          email,
          role,
          token: '', // Token is managed by Supabase
        });
      } else {
        // User is deactivated
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    // First set up the listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => {
            fetchUserData(session.user.id, session.user.email || '');
          }, 0);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
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
