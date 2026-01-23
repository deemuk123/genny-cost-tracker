import { User, CreateUserRequest, UpdateUserRequest, ApiKey, CreateApiKeyRequest, ApiKeyResponse } from '@/types/user';

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

// User Management API
export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
    return handleResponse<User[]>(res);
  },

  getById: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getAuthHeaders() });
    return handleResponse<User>(res);
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  updateRole: async (id: string, role: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/users/${id}/roles`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse<User>(res);
  },

  deactivate: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/users/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  reactivate: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/users/${id}/reactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },
};

// API Key Management
export const apiKeyApi = {
  getAll: async (): Promise<ApiKey[]> => {
    const res = await fetch(`${API_BASE}/api-keys`, { headers: getAuthHeaders() });
    return handleResponse<ApiKey[]>(res);
  },

  create: async (data: CreateApiKeyRequest): Promise<ApiKeyResponse> => {
    const res = await fetch(`${API_BASE}/api-keys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiKeyResponse>(res);
  },

  revoke: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },
};

// External API (for documentation purposes - called by external systems)
export const externalApi = {
  getCostReport: async (apiKey: string, from: string, to: string, generatorId?: string) => {
    const query = new URLSearchParams({ from, to });
    if (generatorId) query.append('generatorId', generatorId);
    
    const res = await fetch(`${API_BASE}/generator/external/cost-report?${query}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return handleResponse(res);
  }
};
