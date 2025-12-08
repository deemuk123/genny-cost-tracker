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
| **Admin** | Full access to all features |
| **Operator** | Dashboard, Hour Meter Entry, Issue Fuel |
| **Viewer** | Dashboard, Cost Reports (read-only) |

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
