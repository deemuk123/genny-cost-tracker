import { supabase } from '@/integrations/supabase/client';
import { 
  Generator, 
  HourMeterReading, 
  FuelPurchase, 
  FuelIssue, 
  MonthlyStockCheck,
  FuelStock,
  FuelStockLevels,
  ApiKey
} from '@/types/generator';

// Generators API
export const generatorApi = {
  getAll: async (): Promise<Generator[]> => {
    const { data, error } = await supabase
      .from('generators')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as Generator[];
  },

  getById: async (id: string): Promise<Generator> => {
    const { data, error } = await supabase
      .from('generators')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Generator;
  },

  create: async (data: Omit<Generator, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by'>): Promise<Generator> => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('generators')
      .insert({
        ...data,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result as Generator;
  },

  update: async (id: string, data: Partial<Generator>): Promise<Generator> => {
    const { data: result, error } = await supabase
      .from('generators')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Generator;
  },

  deactivate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('generators')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('generators')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Hour Meter Readings API
export const hourReadingApi = {
  getAll: async (params?: { generatorId?: string; from?: string; to?: string }): Promise<HourMeterReading[]> => {
    let query = supabase.from('hour_meter_readings').select('*').order('date', { ascending: false });
    
    if (params?.generatorId) {
      query = query.eq('generator_id', params.generatorId);
    }
    if (params?.from) {
      query = query.gte('date', params.from);
    }
    if (params?.to) {
      query = query.lte('date', params.to);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as HourMeterReading[];
  },

  create: async (data: Omit<HourMeterReading, 'id' | 'created_at' | 'hours_run' | 'created_by'>): Promise<HourMeterReading> => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('hour_meter_readings')
      .insert({
        ...data,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result as HourMeterReading;
  },

  update: async (id: string, data: Partial<Pick<HourMeterReading, 'opening_hour' | 'closing_hour' | 'date' | 'notes'>>): Promise<HourMeterReading> => {
    const { data: result, error } = await supabase
      .from('hour_meter_readings')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as HourMeterReading;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('hour_meter_readings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getLastReading: async (generatorId: string): Promise<number> => {
    const { data, error } = await supabase
      .rpc('get_last_hour_reading', { p_generator_id: generatorId });
    if (error) throw error;
    return data ?? 0;
  },
};

// Fuel Purchase API
export const fuelPurchaseApi = {
  getAll: async (params?: { from?: string; to?: string; fuelType?: string }): Promise<FuelPurchase[]> => {
    let query = supabase.from('fuel_purchases').select('*').order('date', { ascending: false });
    
    if (params?.from) {
      query = query.gte('date', params.from);
    }
    if (params?.to) {
      query = query.lte('date', params.to);
    }
    if (params?.fuelType && (params.fuelType === 'diesel' || params.fuelType === 'petrol')) {
      query = query.eq('fuel_type', params.fuelType);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as FuelPurchase[];
  },

  create: async (data: Omit<FuelPurchase, 'id' | 'created_at' | 'total_amount' | 'created_by'>): Promise<FuelPurchase> => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('fuel_purchases')
      .insert({
        ...data,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result as FuelPurchase;
  },
};

// Fuel Stock API
export const fuelStockApi = {
  getAll: async (): Promise<FuelStock[]> => {
    const { data, error } = await supabase
      .from('fuel_stock')
      .select('*');
    if (error) throw error;
    return data as FuelStock[];
  },

  getStock: async (): Promise<FuelStockLevels> => {
    const { data, error } = await supabase
      .from('fuel_stock')
      .select('*');
    if (error) throw error;
    
    const stock: FuelStockLevels = { diesel: 0, petrol: 0 };
    (data as FuelStock[]).forEach(s => {
      stock[s.fuel_type] = s.quantity_litres;
    });
    return stock;
  },
};

// Fuel Issue API
export const fuelIssueApi = {
  getAll: async (params?: { generatorId?: string; from?: string; to?: string }): Promise<FuelIssue[]> => {
    let query = supabase.from('fuel_issues').select('*').order('date', { ascending: false });
    
    if (params?.generatorId) {
      query = query.eq('generator_id', params.generatorId);
    }
    if (params?.from) {
      query = query.gte('date', params.from);
    }
    if (params?.to) {
      query = query.lte('date', params.to);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as FuelIssue[];
  },

  create: async (data: Omit<FuelIssue, 'id' | 'created_at' | 'stock_after_issue' | 'created_by'>): Promise<FuelIssue> => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('fuel_issues')
      .insert({
        ...data,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result as FuelIssue;
  },
};

// Monthly Stock Check API
export const stockCheckApi = {
  getAll: async (params?: { year?: number; month?: number }): Promise<MonthlyStockCheck[]> => {
    let query = supabase.from('monthly_stock_checks').select('*').order('check_date', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data as MonthlyStockCheck[];
  },

  create: async (data: Omit<MonthlyStockCheck, 'id' | 'created_at' | 'theoretical_closing' | 'variance' | 'created_by'>): Promise<MonthlyStockCheck> => {
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('monthly_stock_checks')
      .insert({
        ...data,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result as MonthlyStockCheck;
  },
};

// API Keys API
export const apiKeyApi = {
  getAll: async (): Promise<ApiKey[]> => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ApiKey[];
  },

  create: async (data: { name: string; permissions?: string[]; expires_at?: string | null }): Promise<{ apiKey: ApiKey; secretKey: string }> => {
    // Generate a random API key
    const secretKey = `gm_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyPrefix = secretKey.substring(0, 10);
    
    // Hash the key using SHA-256
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const { data: user } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('api_keys')
      .insert({
        name: data.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: data.permissions || ['read:reports'],
        expires_at: data.expires_at || null,
        created_by: user.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return { apiKey: result as ApiKey, secretKey };
  },

  revoke: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Reports API - calculate cost reports
export const reportsApi = {
  getCostReport: async (params: { from: string; to: string; generatorId?: string }): Promise<{
    generators: Array<{
      id: string;
      name: string;
      fuelType: string;
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
    // Get generators
    let genQuery = supabase.from('generators').select('*').eq('is_active', true);
    if (params.generatorId) {
      genQuery = genQuery.eq('id', params.generatorId);
    }
    const { data: generators, error: genError } = await genQuery;
    if (genError) throw genError;

    // Get hour readings for period
    const { data: readings, error: readError } = await supabase
      .from('hour_meter_readings')
      .select('*')
      .gte('date', params.from)
      .lte('date', params.to);
    if (readError) throw readError;

    // Get fuel issues for period
    const { data: issues, error: issueError } = await supabase
      .from('fuel_issues')
      .select('*')
      .gte('date', params.from)
      .lte('date', params.to);
    if (issueError) throw issueError;

    // Get fuel purchases for average cost
    const { data: purchases, error: purchaseError } = await supabase
      .from('fuel_purchases')
      .select('*')
      .lte('date', params.to);
    if (purchaseError) throw purchaseError;

    // Calculate avg cost per fuel type
    const avgCostByType: Record<string, number> = {};
    const purchasesByType = purchases?.reduce((acc, p) => {
      if (!acc[p.fuel_type]) acc[p.fuel_type] = { qty: 0, cost: 0 };
      acc[p.fuel_type].qty += p.quantity_litres;
      acc[p.fuel_type].cost += p.total_amount || 0;
      return acc;
    }, {} as Record<string, { qty: number; cost: number }>);
    
    for (const [type, data] of Object.entries(purchasesByType || {})) {
      avgCostByType[type] = data.qty > 0 ? data.cost / data.qty : 0;
    }

    // Calculate report for each generator
    const report = (generators || []).map(gen => {
      const genReadings = (readings || []).filter(r => r.generator_id === gen.id);
      const genIssues = (issues || []).filter(i => i.generator_id === gen.id);
      
      const totalHours = genReadings.reduce((sum, r) => sum + (r.hours_run || 0), 0);
      const totalFuelIssued = genIssues.reduce((sum, i) => sum + i.quantity_litres, 0);
      const avgCost = avgCostByType[gen.fuel_type] || 0;
      const totalCost = totalFuelIssued * avgCost;
      
      return {
        id: gen.id,
        name: gen.name,
        fuelType: gen.fuel_type,
        totalHours,
        totalFuelIssued,
        avgConsumption: totalHours > 0 ? totalFuelIssued / totalHours : 0,
        totalCost,
        hourlyCost: totalHours > 0 ? totalCost / totalHours : 0,
      };
    });

    const totals = report.reduce((acc, r) => ({
      totalHours: acc.totalHours + r.totalHours,
      totalFuelIssued: acc.totalFuelIssued + r.totalFuelIssued,
      totalCost: acc.totalCost + r.totalCost,
    }), { totalHours: 0, totalFuelIssued: 0, totalCost: 0 });

    return { generators: report, totals };
  },
};
