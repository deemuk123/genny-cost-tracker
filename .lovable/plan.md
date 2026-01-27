

# Implementation Plan: User Creation, Time-Based Hour Entry, and Generator Editing

This plan addresses three issues: user creation not working, hour meter readings needing time-based input, and adding generator edit functionality.

---

## Issue 1: New Users Not Able to Create

### Problem
The current `UserManagement` component calls external REST API endpoints (`/api/users`) that don't exist. User creation needs to go through the backend authentication system.

### Solution
Create a backend function to handle user creation that:
- Creates the user in the authentication system
- Adds their profile
- Assigns their role

### Changes Required

**Create new backend function** `supabase/functions/create-user/index.ts`
- Accept email, name, password, and role
- Use the service role to create the user via admin API
- Insert into profiles table
- Assign role in user_roles table

**Update `src/services/userApi.ts`**
- Modify the `create` function to call the backend function instead of the non-existent REST endpoint
- Update `getAll`, `update`, and other methods to use direct database queries

---

## Issue 2: Hour Meter Readings - Time Format (HH:MM)

### Problem
Currently hour readings are stored as decimal numbers (e.g., 1258.5). The user wants to enter closing time in HH:MM format instead.

### Clarification Needed
The current system tracks **cumulative running hours** (like an odometer) where:
- Opening hour: 1250.5 (total hours run historically)
- Closing hour: 1258.0 (after running more hours)
- Hours run: 7.5 hours

Do you want:
- **Option A**: Keep tracking cumulative hours but display/enter in HH:MM format (e.g., 1258:30 meaning 1258 hours 30 minutes)
- **Option B**: Change to time-of-day based entry (e.g., machine started at 08:00 and stopped at 15:30)

### Proposed Solution (Assuming Option A)
Update the input to accept hours and minutes separately, then convert to decimal for storage:
- Input: 1258 hours, 30 minutes
- Stored as: 1258.5

### Changes Required

**Update `src/components/HourMeterEntry.tsx`**
- Change input from single number field to two fields (hours and minutes)
- Or use a formatted input showing HH:MM
- Convert to decimal before saving: hours + (minutes / 60)
- Display existing readings in HH:MM format

**Helper functions**
- `decimalToHoursMinutes(decimal)` - Convert 1258.5 to { hours: 1258, minutes: 30 }
- `hoursMinutesToDecimal(hours, minutes)` - Convert { hours: 1258, minutes: 30 } to 1258.5

---

## Issue 3: Generators Need to Be Editable

### Problem
The `GeneratorSetup` component only allows adding and deactivating generators. There's no UI to edit existing generator details.

### Solution
Add an Edit button and dialog to modify generator properties.

### Changes Required

**Update `src/components/GeneratorSetup.tsx`**
- Add Edit button (pencil icon) next to the delete button on each generator card
- Create edit dialog (reuse the add dialog structure)
- Pre-populate form with generator's current values
- Use the existing `useUpdateGenerator` hook to save changes
- Allow editing: name, location, capacity, fuel type (if no fuel issued yet)

---

## Technical Details

### Files to Create
1. `supabase/functions/create-user/index.ts` - Backend function for user creation

### Files to Modify
1. `src/services/userApi.ts` - Update to use Supabase directly
2. `src/components/HourMeterEntry.tsx` - Add HH:MM time input format
3. `src/components/GeneratorSetup.tsx` - Add edit functionality

### Database Changes
None required - existing tables and RLS policies support these features.

---

## Summary of Changes

| Feature | Component | Change Type |
|---------|-----------|-------------|
| User Creation | Backend function + userApi | New function + API update |
| Hour Meter Time Format | HourMeterEntry | UI input format change |
| Generator Editing | GeneratorSetup | New edit dialog |

