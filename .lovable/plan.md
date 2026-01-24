
## Complete Backend Implementation Plan

### Overview

This plan will create the complete backend infrastructure for the Generator Hours and Cost Tracker system using Lovable Cloud. It includes database tables for all entities, Row-Level Security policies, helper functions, triggers, and a service layer to connect the frontend.

---

### Phase 1: Database Schema - Core Tables

**1.1 Create fuel_type ENUM**

```sql
CREATE TYPE fuel_type AS ENUM ('diesel', 'petrol');
```

**1.2 Create Generators Table**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Generator name (e.g., "DG-1") |
| generator_id | VARCHAR(50) | Optional custom ID |
| location | VARCHAR(200) | Physical location |
| capacity_kva | DECIMAL(10,2) | Power capacity in kVA |
| fuel_type | fuel_type | Diesel or Petrol |
| start_date | DATE | When tracking started |
| initial_hour_reading | DECIMAL(10,2) | Starting hour meter value |
| initial_fuel_stock | DECIMAL(10,2) | Initial fuel allocated |
| is_active | BOOLEAN | Active status |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

**1.3 Create Hour Meter Readings Table**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| generator_id | UUID | FK to generators |
| date | DATE | Reading date |
| opening_hour | DECIMAL(10,2) | Start of day reading |
| closing_hour | DECIMAL(10,2) | End of day reading |
| hours_run | DECIMAL(10,2) | Calculated (closing - opening) |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.4 Create Fuel Purchases Table**

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

**1.5 Create Fuel Issues Table**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Issue date |
| generator_id | UUID | FK to generators |
| fuel_type | fuel_type | Must match generator fuel type |
| quantity_litres | DECIMAL(10,2) | Amount issued |
| stock_after_issue | DECIMAL(10,2) | Running balance |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.6 Create Fuel Stock Table**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| fuel_type | fuel_type | Unique per fuel type |
| quantity_litres | DECIMAL(10,2) | Current stock level |
| updated_at | TIMESTAMPTZ | Last update |

**1.7 Create Monthly Stock Checks Table**

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
| theoretical_closing | DECIMAL(10,2) | Calculated closing |
| physical_closing | DECIMAL(10,2) | Actual count |
| variance | DECIMAL(10,2) | Difference |
| notes | TEXT | Optional notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**1.8 Create API Keys Table**

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

### Phase 2: Database Triggers and Functions

**2.1 Auto-update Stock After Purchase**

When a fuel purchase is inserted, automatically increase the corresponding fuel stock.

```sql
CREATE FUNCTION update_stock_after_purchase() RETURNS TRIGGER
-- Adds purchased quantity to fuel_stock table
```

**2.2 Auto-update Stock After Issue**

When fuel is issued, automatically decrease the corresponding fuel stock and record the remaining balance.

```sql
CREATE FUNCTION update_stock_after_issue() RETURNS TRIGGER
-- Subtracts issued quantity from fuel_stock
-- Sets stock_after_issue field
```

**2.3 Get Last Hour Reading Function**

Returns the most recent closing hour for a generator, or initial reading if none exists.

```sql
CREATE FUNCTION get_last_hour_reading(generator_id UUID) RETURNS DECIMAL
```

**2.4 Calculate Total Hours Function**

Returns sum of hours_run for a generator within a date range.

```sql
CREATE FUNCTION get_total_hours(generator_id UUID, from_date DATE, to_date DATE) RETURNS DECIMAL
```

**2.5 Calculate Total Fuel Issued Function**

Returns sum of fuel issued to a generator within a date range.

```sql
CREATE FUNCTION get_total_fuel_issued(generator_id UUID, from_date DATE, to_date DATE) RETURNS DECIMAL
```

**2.6 Get Average Fuel Cost Function**

Returns weighted average cost per litre for a fuel type within a date range.

```sql
CREATE FUNCTION get_avg_fuel_cost(fuel_type, from_date DATE, to_date DATE) RETURNS DECIMAL
```

---

### Phase 3: Row-Level Security Policies

**3.1 Generators Table RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View generators | SELECT | All authenticated users |
| Create generator | INSERT | Admin, Maintenance roles |
| Update generator | UPDATE | Admin, Maintenance roles |
| Deactivate generator | UPDATE | Admin only |

**3.2 Hour Meter Readings RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View readings | SELECT | All authenticated users |
| Create reading | INSERT | Admin, Maintenance, Operator roles |
| Update own readings | UPDATE | Creator or Admin |

**3.3 Fuel Purchases RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View purchases | SELECT | All authenticated users |
| Create purchase | INSERT | Admin, Maintenance roles |
| Update purchase | UPDATE | Admin only |

**3.4 Fuel Issues RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View issues | SELECT | All authenticated users |
| Create issue | INSERT | Admin, Maintenance, Operator roles |
| Update issue | UPDATE | Admin only |

**3.5 Fuel Stock RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View stock | SELECT | All authenticated users |
| Update stock | UPDATE | System triggers only |

**3.6 Monthly Stock Checks RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View checks | SELECT | All authenticated users |
| Create check | INSERT | Admin, Maintenance roles |
| Update check | UPDATE | Admin only |

**3.7 API Keys RLS**

| Policy | Access | Condition |
|--------|--------|-----------|
| View keys | SELECT | Super Admin only |
| Manage keys | ALL | Super Admin only |

---

### Phase 4: Reporting Views

**4.1 Generator Summary View**

Provides current status of each generator including:
- Current hour reading
- Total hours run since start
- Total fuel consumed

**4.2 Cost Report Function**

A database function that calculates:
- Total hours per generator for a date range
- Total fuel issued per generator
- Average consumption (litres per hour)
- Total fuel cost (using weighted average rate)
- Hourly running cost

---

### Phase 5: Update Frontend Services

**5.1 Create Supabase API Service**

Replace the fetch-based `api.ts` with Supabase client calls:

| Function | Implementation |
|----------|----------------|
| generatorApi.getAll | `supabase.from('generators').select('*')` |
| generatorApi.create | `supabase.from('generators').insert(...)` |
| hourReadingApi.getAll | `supabase.from('hour_meter_readings').select('*')` |
| fuelPurchaseApi.create | `supabase.from('fuel_purchases').insert(...)` |
| fuelIssueApi.create | `supabase.from('fuel_issues').insert(...)` |

**5.2 Update React Query Hooks**

Update `useGeneratorData.ts` to use Supabase client instead of REST API.

**5.3 Update Components**

Update Dashboard and form components to use the new Supabase-backed hooks.

---

### Phase 6: External API Endpoint

**6.1 Create Cost Report Edge Function**

Create an edge function for external systems to request cost data:

**Endpoint:** `GET /functions/v1/external-cost-report`

**Authentication:** API Key via Bearer token

**Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)
- `generatorId` - Optional filter

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "from": "...", "to": "..." },
    "generators": [...],
    "totals": {...}
  }
}
```

---

### Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | Migration SQL | All tables, triggers, functions, RLS |
| Modify | `src/services/api.ts` | Use Supabase client |
| Modify | `src/hooks/useGeneratorData.ts` | Update query functions |
| Modify | `src/components/Dashboard.tsx` | Use Supabase hooks |
| Modify | `src/components/GeneratorSetup.tsx` | Use Supabase mutations |
| Modify | `src/components/HourMeterEntry.tsx` | Use Supabase mutations |
| Modify | `src/components/FuelPurchase.tsx` | Use Supabase mutations |
| Modify | `src/components/FuelIssue.tsx` | Use Supabase mutations |
| Modify | `src/components/MonthlyStock.tsx` | Use Supabase mutations |
| Modify | `src/components/CostReports.tsx` | Use Supabase for reports |
| Create | `supabase/functions/external-cost-report/index.ts` | External API |

---

### Security Features

1. **Row-Level Security** - All tables protected based on user roles
2. **Role-based Access** - Using existing `has_role()` function
3. **API Key Authentication** - For external system access
4. **Audit Trail** - `created_by` on all records
5. **Data Validation** - Database constraints and triggers

---

### Summary

After implementation:
- All generator data stored in the database with proper relationships
- Automatic stock calculations via triggers
- Role-based access control on all operations
- External API for third-party systems
- Full audit trail of all changes
- Preserved history even after generator deactivation
