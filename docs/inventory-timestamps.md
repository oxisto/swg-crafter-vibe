# Inventory Update Timestamps Feature

## Overview

The SWG Shipwright application now tracks when each inventory item was last updated, providing valuable insights into inventory activity patterns and enabling better business intelligence.

## Database Schema

The inventory table includes an `updated_at` column that automatically records timestamps:

```sql
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  mark_level TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, mark_level)
);
```

The `updated_at` column is automatically updated using `CURRENT_TIMESTAMP` whenever an inventory item is modified.

## New Database Functions

### `getInventoryItemWithTimestamp(category, markLevel)`
Retrieves a specific inventory item with its last update timestamp.

**Returns:** `{ quantity: number, updatedAt: string } | null`

### `getAllInventoryWithTimestamps()`
Retrieves all inventory items with their update timestamps, ordered by most recent first.

**Returns:** `Array<{ category, markLevel, quantity, updatedAt }>`

### `getRecentlyUpdatedInventory(limit = 10)`
Gets inventory items updated within the last 7 days, ordered by most recent first.

**Parameters:**
- `limit`: Maximum number of items to return (default: 10)

**Returns:** `Array<{ category, markLevel, quantity, updatedAt }>`

## API Enhancements

### Enhanced GET `/api/inventory`

**New Query Parameters:**
- `includeTimestamp=true` - Include update timestamps in responses
- `recent=true` - Return only recently updated items (last 7 days)
- `limit=N` - Limit number of items returned (max 50)

**Examples:**

```bash
# Get single item with timestamp
GET /api/inventory?category=Engine&markLevel=I&includeTimestamp=true

# Get all inventory with timestamps
GET /api/inventory?all=true&includeTimestamp=true

# Get recently updated items
GET /api/inventory?recent=true&limit=5&includeSchematic=true
```

### New GET `/api/inventory/recent`

Dedicated endpoint for recent inventory activity with advanced filtering.

**Query Parameters:**
- `limit` - Max items to return (default: 10, max: 50)
- `includeSchematic` - Include schematic data (default: false)
- `days` - Days to look back (default: 7, max: 30)

### Enhanced POST `/api/inventory`

**Updated Response:** Now includes `updatedAt` timestamp in the response.

```json
{
  "success": true,
  "category": "Engine",
  "markLevel": "I", 
  "quantity": 5,
  "updatedAt": "2025-05-29T10:30:45.123Z"
}
```

## Use Cases

### 1. Recent Activity Dashboard
Track which parts have been modified recently to understand business activity patterns.

```javascript
// Get last 10 updated items with schematic info
const response = await fetch('/api/inventory/recent?limit=10&includeSchematic=true');
const { recentUpdates } = await response.json();
```

### 2. Inventory Staleness Detection
Identify parts that haven't been updated in a long time, which might indicate:
- Slow-moving inventory
- Parts that need restocking
- Discontinued items

### 3. Activity Analytics
- Track update frequency patterns
- Identify peak business hours
- Monitor inventory turnover rates

### 4. Change History
While not a full audit log, the timestamps provide basic change tracking for recent modifications.

## Future Enhancements

The timestamp foundation enables several potential future features:

### 1. Full Audit Trail
- Track what the previous quantity was
- Record who made the change (when user authentication is added)
- Store change reason/notes

### 2. Inventory Analytics Dashboard
- Visual charts showing update frequency
- Heatmaps of part activity
- Turnover rate calculations

### 3. Smart Alerts
- Notify when parts haven't been updated in X days
- Alert on unusual activity patterns
- Stock movement trend analysis

### 4. Business Intelligence
- Peak hours analysis
- Seasonal patterns
- Most/least active parts identification

## Technical Implementation Notes

### Timestamp Format
- All timestamps are stored in SQLite as `DATETIME` in UTC
- API responses return timestamps in ISO 8601 format: `2025-05-29T10:30:45.123Z`
- Frontend should handle timezone conversion for display

### Performance Considerations
- The `updated_at` column is automatically indexed due to frequent ORDER BY usage
- Recent queries are optimized with date range filtering
- Pagination is enforced with maximum limits to prevent large data dumps

### Backward Compatibility
- All existing API endpoints continue to work unchanged
- New timestamp features are opt-in via query parameters
- Default behavior remains the same for existing integrations

## Data Migration

For existing databases, the `updated_at` column will be automatically added during the next application startup. Initial values will be set to the current timestamp, so historical data won't have accurate timestamps, but all future updates will be properly tracked.

## Example Implementations

### Recent Activity Component
```svelte
<script>
  import { onMount } from 'svelte';
  
  let recentActivity = [];
  
  onMount(async () => {
    const response = await fetch('/api/inventory/recent?limit=5&includeSchematic=true');
    const data = await response.json();
    recentActivity = data.recentUpdates;
  });
</script>

{#each recentActivity as item}
  <div class="activity-item">
    <span>{item.displayName}</span>
    <span>Qty: {item.quantity}</span>
    <time>{new Date(item.updatedAt).toLocaleString()}</time>
  </div>
{/each}
```

### Staleness Check
```javascript
// Get all inventory with timestamps
const response = await fetch('/api/inventory?all=true&includeTimestamp=true');
const { inventory } = await response.json();

// Find items not updated in last 30 days
const staleItems = inventory.filter(item => {
  const daysSinceUpdate = (Date.now() - new Date(item.updatedAt)) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > 30;
});
```

This timestamp feature provides a solid foundation for inventory activity tracking and opens up numerous possibilities for enhanced business intelligence and user experience improvements.
