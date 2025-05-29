# SWG Shipwright Inventory Manager

A web-based inventory management system for Star Wars Galaxies shipwright business on Restoration III server.

## Features

- **8 Part Categories**: Armor, Booster, Capacitor, Droid Interface, Engine, Reactor, Shield, Weapon
- **5 Mark Levels**: I, II, III, IV, V (Roman numerals)
- **Stock Management**: Increment, decrement, and set exact quantities
- **SQLite Persistence**: All data is saved to a local database
- **Modern UI**: Dark theme with Star Wars styling

## Tech Stack

- **SvelteKit** with Svelte 5
- **TypeScript** for type safety
- **TailwindCSS v4** for styling
- **SQLite** with better-sqlite3 for data persistence
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

## How to Use

### Managing Stock

- **Increment**: Click the green `+` button to add one item
- **Decrement**: Click the red `−` button to remove one item (minimum 0)
- **Set Exact Quantity**: Click on the blue quantity number to edit directly
  - Type the new amount and press Enter to save
  - Press Escape to cancel editing

### Data Persistence

All inventory changes are automatically saved to `database.sqlite3` in the project root. Your data will persist between sessions.

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
