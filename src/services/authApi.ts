import { User } from '@/types/user';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<LoginResponse>(res);
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ProfileResponse>(res);
  },

  logout: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Logout failed');
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ token: string }>(res);
  },
};
