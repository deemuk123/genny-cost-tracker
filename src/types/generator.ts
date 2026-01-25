export type FuelType = 'petrol' | 'diesel';

export interface Generator {
  id: string;
  name: string;
  generator_id?: string | null;
  location?: string | null;
  capacity_kva?: number | null;
  fuel_type: FuelType;
  start_date: string;
  initial_hour_reading: number;
  initial_fuel_stock?: number | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface HourMeterReading {
  id: string;
  generator_id: string;
  date: string;
  opening_hour: number;
  closing_hour: number;
  hours_run?: number | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface FuelPurchase {
  id: string;
  date: string;
  fuel_type: FuelType;
  quantity_litres: number;
  rate_per_litre: number;
  total_amount?: number | null;
  vendor?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface FuelIssue {
  id: string;
  date: string;
  generator_id: string;
  fuel_type: FuelType;
  quantity_litres: number;
  stock_after_issue?: number | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface FuelStock {
  id: string;
  fuel_type: FuelType;
  quantity_litres: number;
  updated_at: string;
}

export interface MonthlyStockCheck {
  id: string;
  check_date: string;
  fuel_type: FuelType;
  fiscal_year?: string | null;
  fiscal_month?: string | null;
  opening_stock: number;
  total_purchases: number;
  total_issues: number;
  theoretical_closing?: number | null;
  physical_closing: number;
  variance?: number | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  permissions: string[];
  created_by?: string | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GeneratorReport {
  generatorId: string;
  generatorName: string;
  totalHours: number;
  totalFuelUsed: number;
  avgConsumption: number;
  totalFuelCost: number;
  hourlyCost: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Helper type for fuel stock object
export interface FuelStockLevels {
  diesel: number;
  petrol: number;
}
