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

## Authentication API

Your backend needs to implement these authentication endpoints:

### POST /api/auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### GET /api/auth/me

Get current user profile. Requires Bearer token.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "admin",
  "isActive": true
}
```

### POST /api/auth/logout

Invalidate current session.

### POST /api/auth/refresh

Refresh JWT token before expiration.

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

---

## External API Integration

External systems can request cost report data using API keys. This allows your ERP, analytics dashboard, or other systems to fetch generator data programmatically.

### Endpoint

```
GET /api/generator/external/cost-report
```

### Authentication

Use a Bearer token with your API key:

```
Authorization: Bearer gk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Start date (YYYY-MM-DD) |
| `to` | string | Yes | End date (YYYY-MM-DD) |
| `generatorId` | string | No | Filter by specific generator |

### Example Request

```bash
curl -X GET \
  "https://your-domain.com/api/generator/external/cost-report?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer gk_live_8x7y6z5w4v3u2t1s0r9q8p7o6n5m4l3k"
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
        "id": "uuid-1",
        "name": "Main Building DG",
        "fuelType": "diesel",
        "totalHours": 245.5,
        "totalFuelUsed": 612.5,
        "avgConsumption": 2.49,
        "totalFuelCost": 58187.50,
        "hourlyCost": 237.02
      },
      {
        "id": "uuid-2",
        "name": "Backup DG",
        "fuelType": "diesel",
        "totalHours": 120.3,
        "totalFuelUsed": 301.2,
        "avgConsumption": 2.50,
        "totalFuelCost": 28614.00,
        "hourlyCost": 237.85
      }
    ],
    "totals": {
      "totalHours": 365.8,
      "totalFuelUsed": 913.7,
      "totalFuelCost": 86801.50,
      "avgHourlyCost": 237.30
    }
  },
  "generatedAt": "2024-01-31T10:30:00Z"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid or expired API key"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "Missing required parameters: from, to"
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 100 requests per hour."
}
```

### Rate Limiting

- **100 requests per hour** per API key
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1704067200`

### Code Examples

**JavaScript/Node.js:**
```javascript
const axios = require('axios');

async function getCostReport(from, to) {
  const response = await axios.get(
    'https://your-domain.com/api/generator/external/cost-report',
    {
      params: { from, to },
      headers: {
        'Authorization': `Bearer ${process.env.GENERATOR_API_KEY}`
      }
    }
  );
  return response.data;
}

// Usage
const report = await getCostReport('2024-01-01', '2024-01-31');
console.log(`Total hours: ${report.data.totals.totalHours}`);
```

**Python:**
```python
import requests
import os

def get_cost_report(from_date, to_date, generator_id=None):
    url = "https://your-domain.com/api/generator/external/cost-report"
    headers = {
        "Authorization": f"Bearer {os.environ['GENERATOR_API_KEY']}"
    }
    params = {
        "from": from_date,
        "to": to_date
    }
    if generator_id:
        params["generatorId"] = generator_id
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Usage
report = get_cost_report("2024-01-01", "2024-01-31")
print(f"Total fuel cost: ₹{report['data']['totals']['totalFuelCost']}")
```

**C#/.NET:**
```csharp
using System.Net.Http.Headers;

public async Task<CostReport> GetCostReportAsync(string from, string to)
{
    var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("GENERATOR_API_KEY"));
    
    var response = await client.GetAsync(
        $"https://your-domain.com/api/generator/external/cost-report?from={from}&to={to}"
    );
    
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadFromJsonAsync<CostReport>();
}
```

---

## Database Schema

See `database/schema.sql` for the complete database schema including:
- `generators` - Generator master data
- `hour_meter_readings` - Daily hour readings
- `fuel_purchases` - Fuel purchase records
- `fuel_issues` - Fuel issued to generators
- `monthly_stock_checks` - Monthly physical stock counts
- `users` - User accounts
- `api_keys` - External API keys

---

## Security Considerations

1. **API Keys**
   - Keys are hashed using SHA-256 before storage
   - Never log or expose full API keys
   - Set expiration dates for production keys
   - Revoke keys immediately if compromised

2. **Authentication**
   - JWT tokens expire after 24 hours
   - Use HTTPS in production
   - Implement proper CORS policies

3. **Rate Limiting**
   - External API: 100 requests/hour
   - All requests are logged for audit

---

## Customization

### Styling
The module uses Tailwind CSS with semantic tokens. Customize by updating:
- `tailwind.config.ts` - Theme colors
- `src/index.css` - CSS variables

### Permissions
Modify `src/lib/permissions.ts` to adjust role access.
