import { Generator, HourMeterReading, FuelPurchase, FuelIssue, MonthlyStockCheck } from '@/types/generator';

// Configure this to point to your backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/generator';

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

// Generators API
export const generatorApi = {
  getAll: async (): Promise<Generator[]> => {
    const res = await fetch(`${API_BASE}/generators`, { headers: getAuthHeaders() });
    return handleResponse<Generator[]>(res);
  },

  getById: async (id: string): Promise<Generator> => {
    const res = await fetch(`${API_BASE}/generators/${id}`, { headers: getAuthHeaders() });
    return handleResponse<Generator>(res);
  },

  create: async (data: Omit<Generator, 'id' | 'createdAt' | 'isActive'>): Promise<Generator> => {
    const res = await fetch(`${API_BASE}/generators`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Generator>(res);
  },

  update: async (id: string, data: Partial<Generator>): Promise<Generator> => {
    const res = await fetch(`${API_BASE}/generators/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Generator>(res);
  },

  deactivate: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/generators/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/generators/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },
};

// Hour Meter Readings API
export const hourReadingApi = {
  getAll: async (params?: { generatorId?: string; from?: string; to?: string }): Promise<HourMeterReading[]> => {
    const query = new URLSearchParams();
    if (params?.generatorId) query.append('generatorId', params.generatorId);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    
    const res = await fetch(`${API_BASE}/hour-readings?${query}`, { headers: getAuthHeaders() });
    return handleResponse<HourMeterReading[]>(res);
  },

  create: async (data: Omit<HourMeterReading, 'id'>): Promise<HourMeterReading> => {
    const res = await fetch(`${API_BASE}/hour-readings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<HourMeterReading>(res);
  },

  getLastReading: async (generatorId: string): Promise<HourMeterReading | null> => {
    const res = await fetch(`${API_BASE}/hour-readings/last/${generatorId}`, { headers: getAuthHeaders() });
    return handleResponse<HourMeterReading | null>(res);
  },
};

// Fuel Purchase API
export const fuelPurchaseApi = {
  getAll: async (params?: { from?: string; to?: string; fuelType?: string }): Promise<FuelPurchase[]> => {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.fuelType) query.append('fuelType', params.fuelType);
    
    const res = await fetch(`${API_BASE}/fuel-purchases?${query}`, { headers: getAuthHeaders() });
    return handleResponse<FuelPurchase[]>(res);
  },

  create: async (data: Omit<FuelPurchase, 'id'>): Promise<FuelPurchase> => {
    const res = await fetch(`${API_BASE}/fuel-purchases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FuelPurchase>(res);
  },

  getStock: async (): Promise<{ diesel: number; petrol: number }> => {
    const res = await fetch(`${API_BASE}/fuel-stock`, { headers: getAuthHeaders() });
    return handleResponse<{ diesel: number; petrol: number }>(res);
  },
};

// Fuel Issue API
export const fuelIssueApi = {
  getAll: async (params?: { generatorId?: string; from?: string; to?: string }): Promise<FuelIssue[]> => {
    const query = new URLSearchParams();
    if (params?.generatorId) query.append('generatorId', params.generatorId);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    
    const res = await fetch(`${API_BASE}/fuel-issues?${query}`, { headers: getAuthHeaders() });
    return handleResponse<FuelIssue[]>(res);
  },

  create: async (data: Omit<FuelIssue, 'id'>): Promise<FuelIssue> => {
    const res = await fetch(`${API_BASE}/fuel-issues`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FuelIssue>(res);
  },
};

// Monthly Stock Check API
export const stockCheckApi = {
  getAll: async (params?: { year?: number; month?: number }): Promise<MonthlyStockCheck[]> => {
    const query = new URLSearchParams();
    if (params?.year) query.append('year', params.year.toString());
    if (params?.month) query.append('month', params.month.toString());
    
    const res = await fetch(`${API_BASE}/stock-checks?${query}`, { headers: getAuthHeaders() });
    return handleResponse<MonthlyStockCheck[]>(res);
  },

  create: async (data: Omit<MonthlyStockCheck, 'id'>): Promise<MonthlyStockCheck> => {
    const res = await fetch(`${API_BASE}/stock-checks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MonthlyStockCheck>(res);
  },
};

// Reports API
export const reportsApi = {
  getCostReport: async (params: { from: string; to: string; generatorId?: string }): Promise<{
    generators: Array<{
      id: string;
      name: string;
      totalHours: number;
      totalFuelIssued: number;
      avgConsumption: number;
      totalCost: number;
      hourlyCost: number;
    }>;
    totals: {
      totalHours: number;
      totalFuelIssued: number;
      totalCost: number;
    };
  }> => {
    const query = new URLSearchParams();
    query.append('from', params.from);
    query.append('to', params.to);
    if (params.generatorId) query.append('generatorId', params.generatorId);
    
    const res = await fetch(`${API_BASE}/reports/cost?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
};
