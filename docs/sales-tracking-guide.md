# Sales Tracking Feature Guide

The SWG Crafter now includes comprehensive sales tracking functionality that integrates with the Go-based mail analyzer tool to track your shipwright business performance.

## Complete Workflow

### 1. Generate JSON Data from Mail Files

First, use the Go mail analyzer tool to process your SWG mail files:

```bash
# Navigate to the tool directory
cd tools/mail-analyzer

# Parse mail files and generate JSON export
go run . parse -i /path/to/your/mail/files -o sales_export.json --sender-filter "SWG.Restoration.auctioner" --subject-filter "Sale Complete" -v
```

**Parameters:**
- `-i`: Input directory containing .mail files
- `-o`: Output JSON file name
- `--sender-filter`: Filter by sender (use "SWG.Restoration.auctioner" for sales)
- `--subject-filter`: Filter by subject pattern (use "Sale Complete" for instant sales)
- `-v`: Verbose output to see processing details

### 2. Import Data into Web Application

1. Open the SWG Crafter web application
2. Navigate to **Sales Tracking** in the sidebar (💰 icon)
3. In the "Import Mail Data" section:
   - Click "Choose File" and select your JSON export file
   - Click "Import Mail Data"
   - Wait for the upload to complete

### 3. View Analytics and Reports

After importing, you'll see:

**Recent Sales Dashboard (30 Days):**
- Total sales count and credits earned
- Average sale price
- Top selling categories

**All-Time Sales Analytics:**
- Complete sales history
- Mark level distribution
- Total earnings breakdown

**Top Selling Items Table:**
- Most popular items by sales count
- Total and average credits per item
- Performance metrics

**Import History:**
- Track of all data imports
- Date ranges and batch information
- Import success metrics

## Data Processing Details

### Item Categorization
The system automatically categorizes items from sale descriptions:
- **Starship Components**: Armor, Booster, Capacitor, Droid Interface, Engine, Reactor, Shield, Weapon
- **Blasters**: Separated by color (Green, Red, etc.)
- **Mark Levels**: Automatically extracted (I, II, III, IV, V)

### Sale Information Extracted
- Item name and category
- Mark level
- Sale price (credits)
- Buyer information
- Sale location
- Timestamp

### Duplicate Detection
The system prevents duplicate imports by tracking:
- Mail IDs to avoid reprocessing
- Batch IDs for import history
- Timestamp validation

## Business Intelligence Features

### Analytics Metrics
- **Total Sales**: Complete count of items sold
- **Revenue Tracking**: Credits earned over time periods
- **Category Performance**: Which item types sell best
- **Mark Level Analysis**: Profitability by component tier
- **Average Pricing**: Market insights for pricing strategy

### Data Insights
- **Top Performers**: Most profitable items and categories
- **Sales Trends**: Performance over different time periods
- **Inventory Guidance**: Which items to prioritize crafting
- **Market Analysis**: Buyer patterns and locations

## Technical Architecture

### Go Mail Analyzer Tool
- **Purpose**: Raw mail file parsing and data extraction
- **Output**: Clean JSON data with standardized format
- **Filters**: Configurable sender and subject filtering
- **Performance**: Handles hundreds of mail files efficiently

### Web Application Integration
- **API Endpoints**: RESTful endpoints for data import and analytics
- **Database**: SQLite storage with proper indexing
- **Business Logic**: Item categorization and mark level detection
- **UI**: Responsive dashboard with real-time updates

## File Locations

- **Go Tool**: `tools/mail-analyzer/`
- **Database**: `database.sqlite3` (auto-created)
- **Web Interface**: `/sales` page
- **API Endpoints**: `/api/sales/import` and `/api/sales`

## Troubleshooting

### Common Issues
1. **No sales found**: Check sender and subject filters
2. **Import errors**: Verify JSON file format
3. **Missing data**: Ensure mail files contain sale notifications
4. **Duplicates**: System automatically handles duplicate prevention

### Support
- Check console logs for detailed error messages
- Verify mail file timestamps are within expected ranges
- Ensure proper permissions for file access

## Future Enhancements

### Planned Features
- **Charts and Graphs**: Visual analytics dashboards
- **Export Functionality**: CSV/PDF report generation
- **Advanced Filters**: Date range and category filtering
- **Profit Analysis**: Cost vs. revenue calculations
- **Trend Forecasting**: Predictive analytics for sales patterns

### Data Integration
- **Inventory Sync**: Connect sales data with inventory levels
- **Production Planning**: Optimize crafting based on sales data
- **Market Intelligence**: Price recommendations and trends
- **Performance Alerts**: Low stock and high demand notifications

---

*This feature provides comprehensive sales tracking to help you optimize your Star Wars Galaxies shipwright business on the Restoration III server.*
