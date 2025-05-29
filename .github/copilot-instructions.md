# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a SvelteKit application with Svelte 5 and TailwindCSS v4 for managing a Star Wars Galaxies shipwright business on Restoration III server.

## Project Context

- This is a shipwright inventory management system
- There are 5 Mark Levels (I-V, represented as roman numerals)
- 8 part categories: Armor, Booster, Capacitor, Droid Interface, Engine, Reactor, Shield, Weapon
- Focus on simple inventory tracking with increment/decrement controls

## Tech Stack

- SvelteKit with Svelte 5
- TypeScript
- TailwindCSS v4
- Vite for bundling
- Better SQLite3 for local database
- SWGAide integration for schematics data

## Code Style

- Use TypeScript for type safety
- Follow Svelte 5 patterns with runes ($state, $derived, $effect)
- Use TailwindCSS v4 for styling
- Keep components simple and focused
- Use semantic HTML elements

## Current Features (Implemented)

✅ **Core Inventory Management:**

- Interactive 8×5 grid for all part categories and mark levels
- Real-time increment/decrement controls with hover effects
- Click-to-edit quantities with save/cancel functionality
- Color-coded stock levels (red=zero, yellow=low, green=good/excess)
- Persistent storage with SQLite database

✅ **Database & Backend:**

- SQLite database with Better SQLite3
- Complete CRUD operations for inventory items
- Settings management (recommended stock levels)
- API endpoints for inventory, settings, and schematics
- Server-side data validation and persistence

✅ **SWGAide Integration:**

- Automatic download and caching of schematics data
- XML parsing of compressed schematics files
- 24-hour cache refresh cycle
- Database storage of schematic information

✅ **UI/UX:**

- Modern responsive design with TailwindCSS v4
- Intuitive inventory grid layout
- Visual feedback for stock levels
- Settings page for configuration

✅ **AI Assistant:**

- OpenAI function calling integration
- Real-time inventory analysis
- Markdown rendering for formatted responses
- Natural language chat interface
- Dynamic schematics search and filtering
- Stock level recommendations and insights

## Potential Future Features

🔄 **Enhanced Inventory Management:**

- Bulk operations (select multiple items, batch update)
- Import/export functionality (CSV, JSON)
- Inventory history tracking and analytics
- Low stock alerts and notifications
- Quick stock templates (set all to recommended level)

🔄 **Production Planning:**

- Schematics browser with search and filtering
- Production calculator (what can I build with current stock?)
- Shopping list generator (what parts do I need for specific ships?)
- Cost analysis and profit calculations
- Production queue management

🔄 **Business Intelligence:**

- Stock level dashboard with charts
- Turnover rate analysis
- Most/least used parts identification
- Seasonal trends and patterns
- Export reports for business analysis

🔄 **Advanced Features:**

- Multi-character support (different shipwrights)
- Server integration (if APIs become available)
- Barcode/QR code scanning for quick updates
- Mobile-optimized interface
- Dark/light theme toggle
- Backup and restore functionality

🔄 **Collaboration:**

- Share inventory status with guild/friends
- Collaborative inventory management
- Trade request system
- Market price integration (if data available)

## Development Notes

- Database file: `database.sqlite3` (auto-created)
- SWGAide data source: `https://swgaide.com/pub/exports/schematics_unity.xml.gz`
- Inventory uses composite keys: `${category}-${markLevel}`
- All inventory operations go through Svelte stores for reactivity
