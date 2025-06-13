# SWG Shipwright Inventory Manager

A web-based inventory management system for Star Wars Galaxies shipwright business on Restoration III server.

## Features

- **9 Part Categories**: Armor, Booster, Capacitor, Droid Interface, Engine, Reactor, Shield, Blaster (Green), Blaster (Red)
- **5 Mark Levels**: I, II, III, IV, V (Roman numerals)
- **Stock Management**: Increment, decrement, and set exact quantities
- **Update Tracking**: Automatic timestamps for inventory changes and activity history
- **SQLite Persistence**: All data is saved to a local database
- **Modern UI**: Dark theme with Star Wars styling
- **AI Assistant** 🤖: Chat with an intelligent assistant using OpenAI function calling
- **SWGAide Integration**: Automatic schematics data from SWGAide database
- **Markdown Rendering**: Beautiful formatted AI responses
- **Recent Activity**: Track recently updated inventory items
- **Sell Values**: Configure and track inventory values by mark level
- **Sales Tracking** 💰: Comprehensive sales analytics and business intelligence
  - Go-based mail analyzer tool for processing SWG mail files
  - Automatic sale detection and item categorization
  - Revenue tracking and performance analytics
  - Import history and data visualization
  - Business insights and market intelligence

## Tech Stack

- **SvelteKit** with Svelte 5
- **TypeScript** for type safety
- **TailwindCSS v4** for styling
- **SQLite** with better-sqlite3 for data persistence
- **OpenAI API** for AI assistant with function calling
- **pnpm** for package management

## Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start development server**:

   ```bash
   pnpm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5174`

## AI Assistant Setup (Optional)

To use the AI assistant features:

1. **Get an OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Create a `.env` file** in the project root:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```
3. **Restart the dev server** if it's already running
4. **Navigate to the AI Assistant** page and start chatting!

The AI assistant uses OpenAI function calling to:

- Analyze your inventory in real-time
- Provide stock recommendations
- Search schematics database
- Generate formatted reports with markdown

## How to Use

### Managing Stock

- **Increment**: Click the green `+` button to add one item
- **Decrement**: Click the red `−` button to remove one item (minimum 0)
- **Set Exact Quantity**: Click on the blue quantity number to edit directly
  - Type the new amount and press Enter to save
  - Press Escape to cancel editing

### Data Persistence

All inventory changes are automatically saved to `database.sqlite3` in the project root. Your data will persist between sessions.

### Sales Tracking

Track your shipwright business performance with comprehensive sales analytics:

1. **Process Mail Files**: Use the Go mail analyzer tool to extract sales data from SWG mail files

   ```bash
   cd tools/mail-analyzer
   go run . parse -i /path/to/mail/files -o sales_export.json --sender-filter "SWG.Restoration.auctioner"
   ```

2. **Import Data**: Upload the JSON file through the Sales Tracking page in the web interface

3. **View Analytics**:
   - Revenue tracking and sales metrics
   - Top selling items and categories
   - Mark level performance analysis
   - Import history and batch tracking

See [`docs/sales-tracking-guide.md`](docs/sales-tracking-guide.md) for detailed instructions.

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run check` - Run type checking
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Check code formatting

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── InventoryItem.svelte    # Individual inventory item component
│   ├── database.ts                 # SQLite database operations
│   ├── stores.ts                   # Svelte stores for state management
│   └── types.ts                    # TypeScript type definitions
├── routes/
│   ├── api/inventory/
│   │   └── +server.ts              # API endpoint for inventory updates
│   ├── +layout.svelte              # App layout
│   ├── +page.server.ts             # Server-side data loading
│   └── +page.svelte                # Main inventory page
└── hooks.server.ts                 # Server initialization
```

## Database Schema

The SQLite database contains one table:

```sql
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  mark_level TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, mark_level)
)
```

## Contributing

This is a personal project for managing a Star Wars Galaxies shipwright business. Feel free to fork and modify for your own use!

## May the Force be with your shipwright business! 🌟
