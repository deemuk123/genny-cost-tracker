
## Complete Backend Implementation Plan

### Overview

This plan will create the full backend infrastructure for the Generator Hours and Cost Tracker, including:
1. Database tables for generators, hour meter readings, fuel purchases, fuel issues, fuel stock, monthly stock checks, and API keys
2. Database triggers for automatic stock management
3. Helper functions for reports
4. RLS policies for role-based access control
5. Updated frontend to connect to the database via Supabase
6. External API endpoint for data sharing
7. Super admin setup with credentials: `deepesh.k.sharma@gmail.com` / `Root@132#`

---

### Phase 1: Database Migration

Create a new database migration with all core tables:

**1.1 fuel_type ENUM**
```sql
CREATE TYPE public.fuel_type AS ENUM ('diesel', 'petrol');
```

**1.2 Generators Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Generator name |
| generator_id | VARCHAR(50) | Optional custom ID |
| location | VARCHAR(200) | Physical location |
| capacity_kva | DECIMAL(10,2) | Power capacity |
| fuel_type | fuel_type | Diesel or Petrol |
| start_date | DATE | Tracking start date |
| initial_hour_reading | DECIMAL(10,2) | Starting hour meter |
| initial_fuel_stock | DECIMAL(10,2) | Initial fuel allocated |
| is_active | BOOLEAN | Active status |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

**1.3 Hour Meter Readings Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| generator_id | UUID | FK to generators |
| date | DATE | Reading date |
| opening_hour | DECIMAL(10,2) | Start reading |
| closing_hour | DECIMAL(10,2) | End reading |
| hours_run | DECIMAL(10,2) | Calculated |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.4 Fuel Purchases Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Purchase date |
| fuel_type | fuel_type | Diesel or Petrol |
| quantity_litres | DECIMAL(10,2) | Amount purchased |
| rate_per_litre | DECIMAL(10,2) | Unit price |
| total_amount | DECIMAL(12,2) | Calculated total |
| vendor | VARCHAR(200) | Supplier name |
| invoice_number | VARCHAR(100) | Invoice reference |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.5 Fuel Issues Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Issue date |
| generator_id | UUID | FK to generators |
| fuel_type | fuel_type | Must match generator |
| quantity_litres | DECIMAL(10,2) | Amount issued |
| stock_after_issue | DECIMAL(10,2) | Running balance |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.6 Fuel Stock Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| fuel_type | fuel_type | Unique per type |
| quantity_litres | DECIMAL(10,2) | Current stock |
| updated_at | TIMESTAMPTZ | Last update |

**1.7 Monthly Stock Checks Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| check_date | DATE | Check date |
| fuel_type | fuel_type | Diesel or Petrol |
| fiscal_year | VARCHAR(20) | Nepali fiscal year |
| fiscal_month | VARCHAR(50) | Nepali month name |
| opening_stock | DECIMAL(10,2) | Starting stock |
| total_purchases | DECIMAL(10,2) | Sum of purchases |
| total_issues | DECIMAL(10,2) | Sum of issues |
| theoretical_closing | DECIMAL(10,2) | Calculated |
| physical_closing | DECIMAL(10,2) | Actual count |
| variance | DECIMAL(10,2) | Difference |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.8 API Keys Table**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| key_hash | VARCHAR(64) | SHA-256 hash |
| key_prefix | VARCHAR(10) | Display prefix |
| name | VARCHAR(100) | Description |
| permissions | TEXT[] | Allowed operations |
| created_by | UUID | User who created |
| expires_at | TIMESTAMPTZ | Expiration date |
| last_used_at | TIMESTAMPTZ | Last access |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

### Phase 2: Database Triggers

**2.1 Auto-update Stock After Purchase**
```sql
CREATE OR REPLACE FUNCTION public.update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fuel_stock (fuel_type, quantity_litres)
    VALUES (NEW.fuel_type, NEW.quantity_litres)
    ON CONFLICT (fuel_type) 
    DO UPDATE SET 
        quantity_litres = fuel_stock.quantity_litres + NEW.quantity_litres,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**2.2 Auto-update Stock After Issue**
```sql
CREATE OR REPLACE FUNCTION public.update_stock_after_issue()
RETURNS TRIGGER AS $$
DECLARE
    current_stock DECIMAL(10,2);
BEGIN
    SELECT quantity_litres INTO current_stock 
    FROM public.fuel_stock 
    WHERE fuel_type = NEW.fuel_type;
    
    NEW.stock_after_issue := COALESCE(current_stock, 0) - NEW.quantity_litres;
    
    UPDATE public.fuel_stock 
    SET quantity_litres = NEW.stock_after_issue,
        updated_at = NOW()
    WHERE fuel_type = NEW.fuel_type;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**2.3 Calculate Hours Run**
```sql
CREATE OR REPLACE FUNCTION public.calculate_hours_run()
RETURNS TRIGGER AS $$
BEGIN
    NEW.hours_run := NEW.closing_hour - NEW.opening_hour;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**2.4 Calculate Total Amount**
```sql
CREATE OR REPLACE FUNCTION public.calculate_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := NEW.quantity_litres * NEW.rate_per_litre;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 3: Helper Functions for Reports

**3.1 Get Last Hour Reading**
```sql
CREATE OR REPLACE FUNCTION public.get_last_hour_reading(p_generator_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    last_reading DECIMAL(10,2);
    initial_reading DECIMAL(10,2);
BEGIN
    SELECT closing_hour INTO last_reading
    FROM public.hour_meter_readings
    WHERE generator_id = p_generator_id
    ORDER BY date DESC, created_at DESC
    LIMIT 1;
    
    IF last_reading IS NULL THEN
        SELECT initial_hour_reading INTO initial_reading
        FROM public.generators
        WHERE id = p_generator_id;
        RETURN COALESCE(initial_reading, 0);
    END IF;
    
    RETURN last_reading;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 4: Row-Level Security Policies

**Generators Table RLS**
- All authenticated users can view active generators
- Admin/Maintenance roles can create/update
- Only Admin can deactivate

**Hour Meter Readings RLS**
- All authenticated users can view
- Admin/Maintenance/Operator roles can create
- Creator or Admin can update

**Fuel Purchases RLS**
- All authenticated users can view
- Admin/Maintenance roles can create
- Only Admin can update/delete

**Fuel Issues RLS**
- All authenticated users can view
- Admin/Maintenance/Operator roles can create
- Only Admin can update/delete

**Fuel Stock RLS**
- All authenticated users can view
- Only system triggers can update

**Monthly Stock Checks RLS**
- All authenticated users can view
- Admin/Maintenance roles can create
- Only Admin can update

**API Keys RLS**
- Only Super Admin can view and manage

---

### Phase 5: Update Frontend Service Layer

**5.1 Create New API Service (`src/services/api.ts`)**

Replace the fetch-based API with direct Supabase calls:

```typescript
import { supabase } from '@/integrations/supabase/client';

export const generatorApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('generators')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },
  
  create: async (data) => {
    const { data: result, error } = await supabase
      .from('generators')
      .insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },
  // ... more methods
};
```

**5.2 Update React Query Hooks (`src/hooks/useGeneratorData.ts`)**

Keep the existing hook structure but ensure they call the updated API service.

---

### Phase 6: Update Frontend Components

All components currently using `useGeneratorStore` will be updated to use React Query hooks instead:

| Component | Changes |
|-----------|---------|
| `Dashboard.tsx` | Replace store calls with hooks |
| `GeneratorSetup.tsx` | Use `useGenerators`, `useAddGenerator` |
| `HourMeterEntry.tsx` | Use `useHourReadings`, `useAddHourReading` |
| `FuelPurchase.tsx` | Use `useFuelPurchases`, `useAddFuelPurchase`, `useFuelStock` |
| `FuelIssue.tsx` | Use `useFuelIssues`, `useAddFuelIssue`, `useFuelStock` |
| `MonthlyStock.tsx` | Use `useStockChecks`, `useAddStockCheck` |
| `CostReports.tsx` | Use `useCostReport` |

---

### Phase 7: External API Endpoint

**Create Edge Function: `external-cost-report`**

```
GET /functions/v1/external-cost-report
Authorization: Bearer <API_KEY>
Query Params: from, to, generatorId (optional)
```

Response format:
```json
{
  "success": true,
  "data": {
    "period": { "from": "2024-01-01", "to": "2024-01-31" },
    "generators": [
      {
        "id": "uuid",
        "name": "DG-1",
        "totalHours": 245.5,
        "totalFuelUsed": 612.5,
        "avgConsumption": 2.49,
        "totalFuelCost": 58187.50,
        "hourlyCost": 237.02
      }
    ],
    "totals": {
      "totalHours": 450.2,
      "totalFuelUsed": 1125.0,
      "totalFuelCost": 106875.00
    }
  }
}
```

---

### Phase 8: Super Admin Setup

Call the existing `setup-admin` edge function with:
- Email: `deepesh.k.sharma@gmail.com`
- Password: `Root@132#`
- Role: `super_admin`

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_create_generator_tables.sql` | All core tables, triggers, functions, RLS |
| `supabase/functions/external-cost-report/index.ts` | External API endpoint |

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/api.ts` | Replace with Supabase client calls |
| `src/hooks/useGeneratorData.ts` | Update to use new API service |
| `src/components/Dashboard.tsx` | Use React Query hooks |
| `src/components/GeneratorSetup.tsx` | Use React Query hooks |
| `src/components/HourMeterEntry.tsx` | Use React Query hooks |
| `src/components/FuelPurchase.tsx` | Use React Query hooks |
| `src/components/FuelIssue.tsx` | Use React Query hooks |
| `src/components/MonthlyStock.tsx` | Use React Query hooks |
| `src/components/CostReports.tsx` | Use React Query hooks |
| `src/store/generatorStore.ts` | Remove or simplify (optional, for local UI state only) |

---

### Security Summary

1. **Row-Level Security** on all tables based on user roles
2. **Role-based access control** using `has_role()` function
3. **API Key authentication** for external systems (hashed with SHA-256)
4. **Audit trail** with `created_by` on all records
5. **Data validation** via database triggers

---

### Credentials

After implementation, login with:
- **Email**: `deepesh.k.sharma@gmail.com`
- **Password**: `Root@132#`
- **Role**: `super_admin` (full system access)
