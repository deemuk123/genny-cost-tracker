

# Fix: API Not Sending Data - Permission Mismatch

## Root Cause Identified

The `external-hour-readings` edge function has a **permission string mismatch**:

| Function | Checks For | Existing API Key Has |
|----------|------------|---------------------|
| external-cost-report | `read:reports` OR `reports:read` | `reports:read` |
| external-hour-readings | `read:reports` OR `read:hours` | `reports:read` |

The `external-hour-readings` function checks for `read:reports` but the existing API key has `reports:read`. The `external-cost-report` function works because it checks for BOTH formats.

## Solution

Update `supabase/functions/external-hour-readings/index.ts` to also accept the `reports:read` permission format (for consistency with existing API keys):

### Change Required

**File:** `supabase/functions/external-hour-readings/index.ts`

**Line 76:** Change the permission check from:
```typescript
if (!permissions.includes('read:reports') && !permissions.includes('read:hours')) {
```

To:
```typescript
if (!permissions.includes('read:reports') && !permissions.includes('reports:read') && !permissions.includes('read:hours') && !permissions.includes('hours:read')) {
```

This ensures the function accepts:
- `read:reports` (new format)
- `reports:read` (legacy format) 
- `read:hours` (new format)
- `hours:read` (legacy format)

## Summary

| File | Change |
|------|--------|
| `supabase/functions/external-hour-readings/index.ts` | Add `reports:read` and `hours:read` to permission check |

This is a one-line fix that will make the API work with existing API keys.

