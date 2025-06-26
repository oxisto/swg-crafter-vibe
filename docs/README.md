# SWG Shipwright Manager Documentation

This directory contains comprehensive documentation for the Star Wars Galaxies Shipwright Inventory Management System.

## 📁 Documentation Structure

### Core Documentation

- **[API Documentation](./api-documentation.md)** - Complete API reference for the unified inventory endpoint
- **[Schematics Analysis](./schematics-analysis.md)** - Detailed analysis of SWGAide schematics data and ID mappings
- **[Resource Class Mapping](./resource-class-mapping.md)** - Resource code to human-readable name mapping system
- **[AI Features](./ai-features.md)** - AI assistant setup, capabilities, and usage guide

## 🚀 Quick Start

For getting started with the application, see the main [README](../README.md) in the project root.

### AI Assistant Setup

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.example` to `.env` and add your API key
3. Navigate to the AI Assistant page in the application
4. Start chatting with your intelligent inventory assistant!

## 📊 Key Features Documented

### Inventory Management

- 9×5 grid system (9 part categories × 5 mark levels)
- Real-time increment/decrement controls
- Color-coded stock level indicators
- Persistent SQLite database storage

### AI Assistant 🤖

- **Natural Language Interface**: Chat with your inventory data using OpenAI function calling
- **Intelligent Analysis**: AI-powered stock level recommendations with real-time data
- **Production Planning**: Get crafting suggestions based on current stock
- **OpenAI Integration**: Powered by GPT models with dynamic function calling
- **Markdown Rendering**: Beautiful formatted responses with tables, lists, and styling
- **Function Calling**: Efficient, token-optimized data access

### Part Categories

1. **Armor** - Ship hull protection components
2. **Booster** - Speed enhancement systems
3. **Capacitor** - Energy storage components
4. **Droid Interface** - Astromech integration systems
5. **Engine** - Propulsion systems
6. **Reactor** - Power generation components
7. **Shield** - Defensive energy barriers
8. **Blaster (Green)** - Energy weapon systems (green targeting)
9. **Blaster (Red)** - Energy weapon systems (red targeting)

### Mark Levels

- **Mark I** - Light/Basic components
- **Mark II** - Mid-Grade components
- **Mark III** - Heavy components
- **Mark IV** - Advanced components
- **Mark V** - Experimental components

## 🔗 SWGAide Integration

The application integrates with SWGAide's schematics database to provide:

- Automatic schematic data downloads
- 24-hour cache refresh cycles
- Complete schematic ID to inventory item mappings
- Support for 3,673+ ship component schematics

## 💾 Database Schema

The application uses SQLite with the following key tables:

- `inventory` - Stock quantities for each part category/mark level
- `settings` - Configuration and recommended stock levels
- `schematics` - Cached SWGAide schematic data

## 🛠 Technical Stack

- **Frontend**: SvelteKit with Svelte 5, TypeScript, TailwindCSS v4
- **Backend**: SvelteKit API routes with Better SQLite3
- **Data Source**: SWGAide schematics XML export
- **Build Tool**: Vite

## 📝 Contributing

When adding new documentation:

1. Place files in appropriate subdirectories
2. Update this README with links to new docs
3. Follow existing naming conventions
4. Include code examples where applicable

## 🔄 Recent Changes

### AI Architecture Improvements

- **OpenAI Function Calling**: Replaced context injection with dynamic function calling
- **Token Efficiency**: Reduced API costs by fetching only needed data
- **Real-time Data Access**: AI always gets the latest inventory and schematic information
- **Markdown Rendering**: Beautiful formatted AI responses with tables, headers, and styling

### Data Architecture Improvements

- Normalized XML data storage (clean `id`/`name` properties)
- Combined inventory APIs into unified endpoint
- Split weapon category into distinct blaster types
- Enhanced type safety with comprehensive TypeScript definitions

### API Consolidation

- Unified `/api/inventory` endpoint supporting both individual and bulk operations
- Optional schematic data inclusion via query parameters
- Consistent response formats across all operations
