import { useState, useEffect, createContext, useContext } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'maintenance' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  // If no context, return a mock for standalone development
  if (!context) {
    return {
      user: {
        id: 'dev-user',
        name: 'Deepesh K. Sharma',
        email: 'deepesh.k.sharma@gmail.com',
        role: 'super_admin',
        token: 'dev-token',
      },
      isAuthenticated: true,
      isLoading: false,
      login: async () => {},
      logout: () => {},
    };
  }
  
  return context;
}

// Export context for parent app integration
export { AuthContext };
export type { AuthContextType };
