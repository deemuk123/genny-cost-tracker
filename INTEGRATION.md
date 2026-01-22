# Generator Tracker Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install zustand lucide-react date-fns recharts @tanstack/react-query
```

### 2. Copy Module Files

Copy the following folders to your project:
- `src/components/` → `src/modules/generator-tracker/components/`
- `src/hooks/` → `src/modules/generator-tracker/hooks/`
- `src/lib/` → `src/modules/generator-tracker/lib/`
- `src/services/` → `src/modules/generator-tracker/services/`
- `src/types/` → `src/modules/generator-tracker/types/`
- `src/store/` → `src/modules/generator-tracker/store/`
- `src/module-entry.tsx` → `src/modules/generator-tracker/index.tsx`

### 3. Configure Environment Variables

Create/update your `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=/api/generator
VITE_USE_API=true
```

### 4. Integrate with Your Auth System

```tsx
import { GeneratorTrackerModule, AuthContext, AuthContextType } from './modules/generator-tracker';

function App() {
  // Connect to your existing auth system
  const authValue: AuthContextType = {
    user: {
      id: yourUser.id,
      name: yourUser.name,
      email: yourUser.email,
      role: yourUser.role as 'admin' | 'operator' | 'viewer',
      token: yourAuthToken,
    },
    isAuthenticated: !!yourUser,
    isLoading: isAuthLoading,
    login: yourLoginFunction,
    logout: yourLogoutFunction,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <GeneratorTrackerModule />
    </AuthContext.Provider>
  );
}
```

---

## Role-Based Access

| Role | Access |
|------|--------|
| **Super Admin** | Full access + User Management + API Keys |
| **Admin** | Full access to all features |
| **Maintenance** | Dashboard, Hour Meter Entry, Issue Fuel, Monthly Stock, Cost Reports |
| **Operator** | Dashboard, Hour Meter Entry, Issue Fuel |
| **Viewer** | Dashboard, Cost Reports (read-only) |

### Default Super Admin
- Email: `deepesh.k.sharma@gmail.com`
- Role: `super_admin` (cannot be changed or deactivated)

---

## Backend API Endpoints

Implement these endpoints in your backend:

### Generators
- `GET /api/generator/generators` - List all generators
- `POST /api/generator/generators` - Create generator (Admin)
- `PUT /api/generator/generators/:id` - Update generator (Admin)
- `POST /api/generator/generators/:id/deactivate` - Deactivate (Admin)
- `DELETE /api/generator/generators/:id` - Delete (Admin)

### Hour Readings
- `GET /api/generator/hour-readings` - List readings (query: generatorId, from, to)
- `POST /api/generator/hour-readings` - Add reading (Admin, Operator)
- `GET /api/generator/hour-readings/last/:generatorId` - Get last reading

### Fuel Purchases
- `GET /api/generator/fuel-purchases` - List purchases (query: from, to, fuelType)
- `POST /api/generator/fuel-purchases` - Add purchase (Admin)
- `GET /api/generator/fuel-stock` - Get current stock levels

### Fuel Issues
- `GET /api/generator/fuel-issues` - List issues (query: generatorId, from, to)
- `POST /api/generator/fuel-issues` - Issue fuel (Admin, Operator)

### Stock Checks
- `GET /api/generator/stock-checks` - List checks (query: year, month)
- `POST /api/generator/stock-checks` - Add check (Admin)

### Reports
- `GET /api/generator/reports/cost` - Cost report (query: from, to, generatorId)

### User Management (Super Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/roles` - Update user role
- `POST /api/users/:id/deactivate` - Deactivate user
- `POST /api/users/:id/reactivate` - Reactivate user

### API Keys (Super Admin only)
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Generate new API key
- `DELETE /api/api-keys/:id` - Revoke API key

### External API (for other systems)
- `GET /api/generator/external/cost-report` - Get cost report data

---

## External API Integration

External systems can request cost report data using API keys.

### Endpoint
```
GET /api/generator/external/cost-report?from=2024-01-01&to=2024-01-31
Authorization: Bearer <API_KEY>
```

### Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "nepaliPeriod": "Magh 2080 BS"
    },
    "generators": [
      {
        "id": "uuid",
        "name": "Main Building DG",
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
      "totalFuelCost": 106875.00,
      "avgHourlyCost": 237.40
    }
  },
  "generatedAt": "2024-01-31T10:30:00Z"
}
```

### Rate Limiting
- 100 requests per hour per API key
- All requests are logged for audit

---

## Database Schema

```sql
-- See the full schema in the project's SQL documentation
CREATE TABLE generators (...);
CREATE TABLE hour_meter_readings (...);
CREATE TABLE fuel_purchases (...);
CREATE TABLE fuel_issues (...);
CREATE TABLE monthly_stock_checks (...);
```

---

## Development Mode

For standalone development without your backend:
- Set `VITE_USE_API=false` to use localStorage persistence
- The module will use mock data and local state

---

## Customization

### Styling
The module uses Tailwind CSS with semantic tokens. Customize by updating:
- `tailwind.config.ts` - Theme colors
- `src/index.css` - CSS variables

### Permissions
Modify `src/lib/permissions.ts` to adjust role access.
