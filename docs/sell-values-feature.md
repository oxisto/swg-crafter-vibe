# Sell Values Feature Documentation

## Overview

The Sell Values feature allows shipwrights to specify a sell value for each Mark Level (I-V) and automatically calculate the total value of their inventory. This feature helps track the monetary worth of stored parts and make informed business decisions.

## Features Implemented

### 1. Database Schema Updates

- Added sell value settings to the database with keys `sellValue_I`, `sellValue_II`, etc.
- Automatic initialization of default sell values (0) for new databases
- Support for decimal values to accommodate precise pricing

### 2. Settings Management

- **Settings Page**: New sell values section with intuitive grid layout
- **Edit Mode**: Click "Edit" to modify all mark level values simultaneously
- **Validation**: Ensures all values are numbers ≥ 0
- **Persistence**: Values are automatically saved to the database

### 3. Inventory Value Calculation

- **Total Inventory Value**: Displays the sum of all parts × their respective sell values
- **Value by Mark Level**: Shows breakdown of inventory value per mark level
- **Real-time Updates**: Values update automatically when inventory changes

### 4. User Interface Enhancements

- **Value Summary Card**: Prominent display on the inventory page
- **Responsive Grid**: Adapts to different screen sizes
- **Quick Settings Link**: Direct access to configure sell values from inventory page
- **Conditional Display**: Value summary only shows when sell values are configured

## Technical Implementation

### Database Functions

```typescript
// Get all sell values
getSellValues(): Record<string, number>

// Set individual sell value
setSellValue(markLevel: string, value: number): void

// Set all sell values at once
setSellValues(sellValues: Record<string, number>): void
```

### API Endpoints

- `GET /api/settings` - Returns both `recommendedStockLevel` and `sellValues`
- `POST /api/settings` - Accepts `sellValues` object for bulk updates

### Utility Functions

```typescript
// Calculate total inventory value
calculateInventoryValue(inventory: Inventory, sellValues: Record<MarkLevel, number>): number

// Calculate value for specific mark level
calculateMarkLevelValue(inventory: Inventory, markLevel: MarkLevel, sellValue: number): number
```

## Usage Guide

### Setting Sell Values

1. Navigate to **Settings** page
2. Find the **Sell Values** section under **Inventory Settings**
3. Click **Edit** to modify values
4. Enter the sell price for each Mark Level (I through V)
5. Click **Save** to persist changes

### Viewing Inventory Value

1. Go to **Inventory** page
2. If sell values are configured, the **Inventory Value Summary** appears at the top
3. View:
   - **Total Value**: Sum of all inventory worth
   - **Mark Level Breakdown**: Value per mark level with unit prices
   - **Real-time Updates**: Values change as inventory is modified

### Example Use Cases

- **Business Planning**: Track total inventory investment
- **Profitability Analysis**: Compare mark level values to identify best investments
- **Stock Optimization**: Focus on high-value, low-stock items
- **Market Pricing**: Set competitive sell values based on server economy

## Data Format

### Settings Storage

```json
{
	"recommendedStockLevel": 10,
	"sellValues": {
		"I": 1000,
		"II": 2500,
		"III": 5000,
		"IV": 10000,
		"V": 25000
	}
}
```

### API Response Format

```json
{
	"success": true,
	"sellValues": {
		"I": 1000,
		"II": 2500,
		"III": 5000,
		"IV": 10000,
		"V": 25000
	}
}
```

## Future Enhancements

### Potential Additions

- **Historical Value Tracking**: Track inventory value over time
- **Profit Margins**: Configure buy/sell prices to calculate profit
- **Market Integration**: Automatically fetch current market prices
- **Value Alerts**: Notifications when inventory value reaches thresholds
- **Export Reports**: Generate value reports for business analysis
- **Multiple Price Sets**: Different sell values for different buyers/markets

### Integration Opportunities

- **Schematic Calculator**: Factor in sell values when calculating production costs
- **AI Assistant**: Include value analysis in inventory recommendations
- **Production Planning**: Prioritize crafting based on value margins

## Technical Notes

### Performance Considerations

- Value calculations use derived state for efficiency
- Database queries are optimized for bulk sell value operations
- UI updates are reactive and don't require manual refresh

### Accessibility

- All form inputs have proper labels
- Keyboard navigation support for editing
- Screen reader friendly value displays

### Browser Compatibility

- Uses standard JavaScript number formatting
- Responsive CSS Grid for cross-device support
- Progressive enhancement for value display

## Conclusion

The Sell Values feature provides shipwrights with powerful tools for inventory valuation and business management. The implementation is scalable, user-friendly, and integrates seamlessly with existing inventory management workflows.
