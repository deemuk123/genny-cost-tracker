import { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContext, User, UserRole } from '@/hooks/useAuth';
import { authApi } from '@/services/authApi';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get token from storage
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getProfile();
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          token,
        });
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [getToken]);

  // Login function
  const login = useCallback(async (token: string) => {
    localStorage.setItem('auth_token', token);
    
    try {
      const userData = await authApi.getProfile();
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        token,
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setUser(null);
    }
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
