import { User, CreateUserRequest, UpdateUserRequest, ApiKey, CreateApiKeyRequest, ApiKeyResponse, UserRole } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';

// User Management API using Supabase directly
export const userApi = {
  getAll: async (): Promise<User[]> => {
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw new Error(profilesError.message);

    // Then get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw new Error(rolesError.message);

    // Map roles to users
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    return (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      role: (roleMap.get(profile.id) || 'viewer') as UserRole,
      isActive: profile.is_active ?? true,
      createdAt: profile.created_at || new Date().toISOString(),
      lastLogin: profile.last_login || undefined,
    }));
  },

  getById: async (id: string): Promise<User> => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) throw new Error(profileError.message);

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', id)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      throw new Error(roleError.message);
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      role: (roleData?.role || 'viewer') as UserRole,
      isActive: profile.is_active ?? true,
      createdAt: profile.created_at || new Date().toISOString(),
      lastLogin: profile.last_login || undefined,
    };
  },

  create: async (data: CreateUserRequest & { password: string }): Promise<User> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    // Update profile name if provided
    if (data.name !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('id', id);

      if (profileError) throw new Error(profileError.message);
    }

    // Update active status if provided
    if (data.isActive !== undefined) {
      const { error: activeError } = await supabase
        .from('profiles')
        .update({ is_active: data.isActive })
        .eq('id', id);

      if (activeError) throw new Error(activeError.message);
    }

    // Update role if provided
    if (data.role !== undefined) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: data.role })
        .eq('user_id', id);

      if (roleError) throw new Error(roleError.message);
    }

    return userApi.getById(id);
  },

  updateRole: async (id: string, role: string): Promise<User> => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: role as UserRole })
      .eq('user_id', id);

    if (error) throw new Error(error.message);

    return userApi.getById(id);
  },

  deactivate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  reactivate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// API Key Management
export const apiKeyApi = {
  getAll: async (): Promise<ApiKey[]> => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      permissions: key.permissions,
      createdBy: key.created_by || '',
      expiresAt: key.expires_at || undefined,
      lastUsedAt: key.last_used_at || undefined,
      isActive: key.is_active,
      createdAt: key.created_at,
    }));
  },

  create: async (data: CreateApiKeyRequest): Promise<ApiKeyResponse> => {
    // Generate a random API key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const secretKey = Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const keyPrefix = secretKey.substring(0, 8);
    
    // Hash the key for storage
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: session } = await supabase.auth.getSession();
    
    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        name: data.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions: data.permissions,
        expires_at: data.expiresAt || null,
        created_by: session?.session?.user?.id || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.key_prefix,
        permissions: newKey.permissions,
        createdBy: newKey.created_by || '',
        expiresAt: newKey.expires_at || undefined,
        lastUsedAt: newKey.last_used_at || undefined,
        isActive: newKey.is_active,
        createdAt: newKey.created_at,
      },
      secretKey,
    };
  },

  revoke: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

// External API (for documentation purposes - called by external systems)
export const externalApi = {
  getCostReport: async (apiKey: string, from: string, to: string, generatorId?: string) => {
    const query = new URLSearchParams({ from, to });
    if (generatorId) query.append('generatorId', generatorId);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-cost-report?${query}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }
    
    return response.json();
  }
};
