import { createContext, useContext } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'maintenance' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
