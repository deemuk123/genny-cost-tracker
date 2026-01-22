export type UserRole = 'super_admin' | 'admin' | 'maintenance' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // First 8 characters of the key for display
  permissions: string[];
  createdBy: string;
  createdByName?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface ApiKeyResponse {
  apiKey: ApiKey;
  secretKey: string; // Only returned on creation
}

export interface ExternalCostReportRequest {
  from: string;
  to: string;
  generatorId?: string;
}

export interface ExternalCostReportResponse {
  success: boolean;
  data: {
    period: {
      from: string;
      to: string;
      nepaliPeriod?: string;
    };
    generators: Array<{
      id: string;
      name: string;
      totalHours: number;
      totalFuelUsed: number;
      avgConsumption: number;
      totalFuelCost: number;
      hourlyCost: number;
    }>;
    totals: {
      totalHours: number;
      totalFuelUsed: number;
      totalFuelCost: number;
      avgHourlyCost: number;
    };
  };
  generatedAt: string;
}
