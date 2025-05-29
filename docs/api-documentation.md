# Combined Inventory API Documentation

## Overview

The `/api/inventory` endpoint now provides comprehensive inventory management functionality, combining both inventory operations and schematic data retrieval in a single, efficient API.

## Endpoints

### GET `/api/inventory`

Retrieve inventory data with optional schematic information.

#### Query Parameters

| Parameter          | Type    | Description                                 | Default |
| ------------------ | ------- | ------------------------------------------- | ------- |
| `category`         | string  | Part category (required unless `all=true`)  | -       |
| `markLevel`        | string  | Mark level I-V (required unless `all=true`) | -       |
| `includeSchematic` | boolean | Include schematic data in response          | `false` |
| `all`              | boolean | Return all inventory items                  | `false` |

#### Examples

**Single Item (Basic):**

```bash
GET /api/inventory?category=Engine&markLevel=I
```

```json
{
	"category": "Engine",
	"markLevel": "I",
	"quantity": 2
}
```

**Single Item (With Schematic):**

```bash
GET /api/inventory?category=Engine&markLevel=I&includeSchematic=true
```

```json
{
	"category": "Engine",
	"markLevel": "I",
	"quantity": 2,
	"displayName": "Mark I Starfighter Engine",
	"schematic": {
		"id": "2907",
		"name": "Mark I Starfighter Engine",
		"category": "1388",
		"profession": "",
		"complexity": 0,
		"datapad": 0
	},
	"schematicId": "2907"
}
```

**All Items (With Schematics):**

```bash
GET /api/inventory?all=true&includeSchematic=true
```

```json
{
  "inventory": [
    {
      "category": "Armor",
      "markLevel": "I",
      "quantity": 0,
      "displayName": "Mark I Starfighter Armor",
      "schematic": {...},
      "schematicId": "2895"
    },
    // ... 44 more items
  ]
}
```

**Blaster Custom Naming:**

```bash
GET /api/inventory?category=Blaster%20(Green)&markLevel=III&includeSchematic=true
```

```json
{
	"category": "Blaster (Green)",
	"markLevel": "III",
	"quantity": 0,
	"displayName": "Heavy Blaster (Green)",
	"schematic": {
		"id": "2845",
		"name": "Heavy Blaster (Green)",
		"category": "1381",
		"profession": "",
		"complexity": 0,
		"datapad": 0
	},
	"schematicId": "2845"
}
```

### POST `/api/inventory`

Update inventory quantities.

#### Request Body

```json
{
	"category": "Engine",
	"markLevel": "I",
	"action": "increment|decrement|set",
	"quantity": 10 // Only required for "set" action
}
```

#### Response

```json
{
	"success": true,
	"category": "Engine",
	"markLevel": "I",
	"quantity": 3
}
```

## Features

### ✅ **Unified Data Access**

- Single API for both inventory and schematic data
- Reduces client-side API calls
- Consistent response format

### ✅ **Flexible Queries**

- Individual items or bulk retrieval
- Optional schematic enhancement
- Clean, structured responses

### ✅ **Custom Display Names**

- Blasters use proper naming (Light/Mid-Grade/Heavy/Advanced/Experimental)
- Consistent display formatting
- Color-specific blaster identification

### ✅ **Inventory Operations**

- Increment/decrement actions
- Direct quantity setting
- Atomic updates with validation

### ✅ **Data Integrity**

- Clean schematic data (normalized during storage)
- Type-safe operations
- Comprehensive error handling

## Migration from Previous APIs

### Before (2 API calls):

```javascript
// Get inventory
const inventory = await fetch('/api/inventory', {method: 'POST', ...});

// Get schematic
const schematic = await fetch('/api/inventory-schematic?category=Engine&markLevel=I');
```

### After (1 API call):

```javascript
// Get both inventory and schematic data
const response = await fetch('/api/inventory?category=Engine&markLevel=I&includeSchematic=true');
```

## Benefits

- **🚀 Performance**: Fewer API calls, faster loading
- **🔧 Maintenance**: Single endpoint to maintain
- **📊 Consistency**: Unified data structure
- **💾 Efficiency**: Combined database queries
- **🎯 Simplicity**: Easier client-side integration

The combined API provides a more efficient and maintainable approach to inventory management while preserving all existing functionality.
