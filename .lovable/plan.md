
# Implementation Plan: Generator Editing, Daily Hour Report, and API Enhancement

This plan addresses three requests:
1. Generator editing should include all fields from creation
2. Create a daily hour meter report view with data by date per generator
3. Add API endpoint for daily hour data

---

## Issue 1: Full Generator Editing

### Current State
The generator edit dialog currently only allows editing:
- Name, Location, Capacity (kVA), Fuel Type

But when creating a generator, you can also set:
- Start Date, Initial Hour Reading, Initial Fuel Stock

### Changes Required

**Update `src/components/GeneratorSetup.tsx`**
- Remove the `{!isEdit && ...}` condition that hides Start Date, Initial Hour Reading, and Initial Fuel Stock fields
- Enable all fields for editing
- Update the `handleEditSubmit` function to include:
  - `start_date`
  - `initial_hour_reading`
  - `initial_fuel_stock`
- Update dialog description to reflect that all fields are editable
- Add the `generator_id` field (missing in both create and edit forms currently)

---

## Issue 2: Daily Hour Meter Report View

### Requested Format
A table showing data like:
```
Date     | DG1 Open | DG1 Close | DG1 Hours | DG2 Open | DG2 Close | DG2 Hours | ...
2026-01-28 | 125:30  | 128:45   | 3:15      | 200:00   | 202:30   | 2:30      | ...
```

### Changes Required

**Create new component `src/components/DailyHourReport.tsx`**
- Add date range filters (from/to)
- Fetch all generators and hour readings for the period
- Pivot data by date with dynamic columns for each generator
- Display opening hour, closing hour, and hours run for each generator on each date
- Format all hours in HH:MM format
- Show totals row at the bottom

**Update `src/pages/Index.tsx`**
- Add new tab option for "Daily Report" in navigation

**Update `src/components/Layout.tsx`**
- Add "Daily Report" navigation item

---

## Issue 3: API for Daily Hour Data

### Current State
The `external-cost-report` endpoint returns aggregated data (totals per generator), not daily readings.

### Changes Required

**Create new edge function `supabase/functions/external-hour-readings/index.ts`**
- Accept date range parameters (`from`, `to`)
- Return all hour meter readings in the date range
- Include generator details (name, fuel type)
- Return data structured by date with readings for each generator

### API Response Structure
```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-01-01", "to": "2026-01-28" },
    "generators": [
      { "id": "...", "name": "DG-1", "fuelType": "diesel" },
      { "id": "...", "name": "DG-2", "fuelType": "petrol" }
    ],
    "readings": [
      {
        "date": "2026-01-28",
        "entries": [
          { "generatorId": "...", "openingHour": 125.5, "closingHour": 128.75, "hoursRun": 3.25 },
          { "generatorId": "...", "openingHour": 200.0, "closingHour": 202.5, "hoursRun": 2.5 }
        ]
      }
    ],
    "totals": {
      "byGenerator": [
        { "generatorId": "...", "name": "DG-1", "totalHours": 50.5 }
      ],
      "grandTotal": 75.0
    }
  }
}
```

---

## Technical Details

### Files to Create
1. `src/components/DailyHourReport.tsx` - New report view component
2. `supabase/functions/external-hour-readings/index.ts` - New API endpoint

### Files to Modify
1. `src/components/GeneratorSetup.tsx` - Enable all fields for editing
2. `src/pages/Index.tsx` - Add daily report tab
3. `src/components/Layout.tsx` - Add navigation for daily report
4. `supabase/config.toml` - Register new edge function
5. `src/services/api.ts` - Add hook for daily hour readings report (optional, for internal use)

### Database Changes
None required - existing tables support these features.

---

## Summary of Changes

| Feature | Component | Change Type |
|---------|-----------|-------------|
| Full Generator Editing | GeneratorSetup.tsx | Enable all form fields for edit mode |
| Daily Hour Report View | DailyHourReport.tsx | New component with pivoted data table |
| Navigation Update | Layout.tsx, Index.tsx | Add new menu item and route |
| External Hour Data API | external-hour-readings | New edge function |

---

## UI Preview

### Daily Hour Report Table
```
+------------+----------+----------+----------+----------+----------+----------+
| Date       | DG1 Open | DG1 Close| DG1 Run  | DG2 Open | DG2 Close| DG2 Run  |
+------------+----------+----------+----------+----------+----------+----------+
| 2026-01-28 | 125:30   | 128:45   | 3:15     | 200:00   | 202:30   | 2:30     |
| 2026-01-27 | 122:00   | 125:30   | 3:30     | 197:15   | 200:00   | 2:45     |
+------------+----------+----------+----------+----------+----------+----------+
| TOTALS     |          |          | 6:45     |          |          | 5:15     |
+------------+----------+----------+----------+----------+----------+----------+
```

