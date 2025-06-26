# Resource Class Mapping System

## Overview

The Star Wars Galaxies schematics system uses short resource class codes (like `stl`, `rad`, `irt`, `crb`) to specify which types of resources can be used for crafting each component. This system provides comprehensive mapping from these cryptic codes to human-readable names and categories for use in schematic displays and resource browsers.

## The Problem

In the schematics data:
- `name`: Shows usage description (e.g., "Metal Casing", "Blaster Core")
- `classes`: Contains short codes (e.g., `["stl"]`, `["rad"]`)

But users need to know:
- What resource types those codes represent
- Which actual resources are available for each requirement

## The Solution

Before:
```
Classes: stl, rad, irt, crb
```

After:
```
Classes: Steel, Radioactive, Inert Gas, Polymer
```

## Current Implementation (COMPLETED & CLEANED)

### Active Files
- `src/lib/data/resource-class-mapping.ts` - Clean TypeScript interface with hierarchical support
- `src/lib/data/resource-class-hierarchy.yaml` - Hierarchical YAML mapping using codes as keys
- `src/routes/schematics/[id]/+page.svelte` - Uses the mapping for schematic display

### Removed Files (Cleanup Completed)
- ~~`resource-class-mapping.yaml`~~ - Deprecated flat YAML mapping (removed)
- ~~`resource-class-hierarchy-old.yaml`~~ - Backup file with old structure (removed)
- ~~`resource-class-mapping-old.ts`~~ - Backup TypeScript file (removed)

## Example Usage

For a Light Blaster schematic requiring:
```json
{
  "name": "Metal Casing",
  "amount": 50,
  "units": "units", 
  "classes": ["stl"]
}
```

The system now shows:
- **Resource**: Metal Casing
- **Amount**: 50 units
- **Classes**: Steel

## Resource Class Code Mapping Examples

| Code | Full Name | Category | Description |
|------|-----------|----------|-------------|
| `stl` | Steel | Metal | High-strength steel alloys for structural components |
| `rad` | Radioactive | Chemical | Radioactive materials for energy cores and reactors |
| `ine` | Inert Gas | Gas | Inert gases for cooling and protective atmospheres |
| `pol` | Polymer | Chemical | Synthetic polymer compounds for insulation |
| `alu` | Aluminum | Metal | Lightweight aluminum alloys for frames and casings |
| `cop` | Copper | Metal | Conductive copper alloys for electrical components |
| `irn` | Iron | Metal | Basic iron alloys for general construction |

### Features ✅
- ✅ Maps resource class codes to human-readable names
- ✅ Hierarchical tree structure reflecting true SWG resource organization
- ✅ Uses resource codes as keys (eliminates redundancy)
- ✅ No descriptions (clean, maintainable structure)
- ✅ Backward compatibility with legacy flat mapping
- ✅ Used in schematic resource displays (tooltips removed as requested)
- ✅ Tree traversal and lookup functions
- ✅ Category-based filtering support

## Architecture

### Hierarchical Structure
The new YAML structure reflects the true SWG resource tree:

```yaml
# Top-level categories use descriptive names
inorganic:
  name: "Inorganic"
  children:
    metal:
      name: "Metal"
      children:
        # Resource codes are keys at leaf nodes
        stl:
          name: "Steel"
        alu:
          name: "Aluminum"
```

### Key Design Decisions
1. **Resource codes as keys**: Eliminates redundancy and improves lookup efficiency
2. **No descriptions**: Keeps the structure clean and focused on essential information
3. **Hierarchical organization**: Reflects true parent-child relationships in SWG
4. **Backward compatibility**: Legacy flat mapping still supported

## Resource Categories

The system organizes resources into the following hierarchical categories:

### Inorganic Resources
- **Metal**: Ferrous (Iron, Steel), Non-Ferrous (Aluminum, Copper)
- **Gemstone**: Crystalline, Amorphous
- **Ore**: Igneous (Intrusive, Extrusive), Sedimentary (Carbonate, Siliclastic)

### Organic Resources
- **Flora**: Wood (Hardwood/Deciduous, Softwood/Conifer/Evergreen), Vegetable (Fungus, Beans, Tubers, Greens), Fruit (Berry, Flower), Grain (Wheat, Oats, Rice, Corn with Wild/Domesticated variants)
- **Fauna**: Meat (Wild, Domesticated, Herbivore, Carnivore, Reptilian, Avian, Insect, Fish), Hide (Scaley, Leathery, Wooly, Bristley), Bone (Animal, Avian), Dairy (Milk, Egg)

### Chemical Resources
- **Gas**: Inert, Reactive, Water Vapor
- **Petrochemical**: Petro Fuel (Solid, Liquid), Lubricating Oil, Polymer, Fiberplast
- **Radioactive**: Class 1-7 materials

### Energy Resources
- **Renewable**: Geothermal
- General energy sources

### Flora Resources
- Wood types (Evergreen, Conifer, Deciduous)
- Fruits (Berry, Flower fruits)
## API Functions

### Hierarchical Lookup Functions
```typescript
import { 
  getResourceInfo, 
  getResourceDisplayName,
  getResourcesByCategory,
  buildResourceTree,
  searchResources 
} from '$lib/data/resource-class-mapping';

// Get detailed resource information
const resourceInfo = getResourceInfo('stl'); // Returns: { name: 'Steel', category: 'inorganic', path: 'inorganic.metal.fer.stl' }

// Get just the display name
const displayName = getResourceDisplayName('stl'); // Returns: "Steel"

// Get all resources in a category
const metalResources = getResourcesByCategory('inorganic'); // Returns array of ResourceClassInfo

// Build complete tree for UI
const tree = buildResourceTree(); // Returns nested tree structure

// Search across all resources
const results = searchResources('steel'); // Returns array of matching resources
```

### Legacy Compatibility
```typescript
import { getResourceClassInfo, getResourceClassName } from '$lib/data/resource-class-mapping';

// Legacy functions still work for backward compatibility
const resourceInfo = getResourceClassInfo('stl'); // Returns: { name: 'Steel', category: 'Metal' }
const name = getResourceClassName('stl'); // Returns: "Steel"
```

## Data Sources

The mapping was built from multiple sources:
- SWGAide schematics XML data
- SWGTracker resource tree structure
- Star Wars Galaxies game documentation
- Community resource databases
- In-game resource class analysis

## Completed Implementation ✅

### Phase 1: Foundation (COMPLETED)
- ✅ **Core TypeScript mapping**: Essential resource classes implemented
- ✅ **YAML hierarchy structure**: Clean, maintainable tree using codes as keys
- ✅ **Schematic integration**: Resource names displayed instead of codes
- ✅ **Tooltip removal**: Simplified, cleaner UI as requested
- ✅ **Backward compatibility**: Legacy flat mapping still supported

### Phase 2: System Architecture (COMPLETED)
- ✅ **Hierarchical lookup functions**: Tree traversal and search
- ✅ **Category-based filtering**: Support for organizing by resource type
- ✅ **Clean code structure**: Removed redundancy and descriptions
- ✅ **TypeScript interface**: Proper type definitions and error handling

## Future Enhancements

### Planned Features
1. **Database Integration**: Load YAML mappings into SQLite database for performance
2. **Dynamic Updates**: Support for updating mappings from external sources
3. **Enhanced Resource Browser**: UI for browsing and filtering by resource hierarchy
4. **Full-text Search**: Search across resource names and hierarchical paths
5. **API Integration**: Connect with live resource tracking services
6. **Resource Spawns**: Integration with resource spawn data and tracking

### User Experience Improvements
1. **Live Resource Matching**: Show which currently spawned resources match each requirement
2. **Quality Analysis**: Recommend best resources based on attributes
3. **Shopping Lists**: Generate resource gathering lists for specific ships
4. **Resource Alerts**: Notify when good quality matching resources spawn

### Maintenance Notes
### Maintenance Notes
- YAML file can be easily updated with new resource discoveries
- TypeScript mapping provides immediate fallback and type safety
- Modular structure allows for easy extension and modification
- Located in: `src/lib/data/resource-class-mapping.ts`
- Exported through: `src/lib/data/index.ts`
- Used in: Schematic detail pages, resource displays

## Technical Implementation

### File Structure
- Resource codes are case-sensitive and typically 3-4 characters
- Some codes have variants (e.g., `cor` for both Cortosis Ore and Corn)
- The system handles unknown codes gracefully with fallback mapping
- Categories are standardized for consistent filtering and grouping

### Usage in Application
The mapping is used in:
1. **Schematic Details Page**: Shows human-readable resource type names instead of codes
2. **Resource Browser**: Extended to filter by schematic requirements
3. **Production Planning**: Helps identify which current resources can be used
4. **AI Assistant**: Provides better context for crafting recommendations

## Recent Changes (Cleanup Completed ✅)
- ✅ **File cleanup**: Removed old backup and deprecated mapping files
- ✅ **Documentation consolidation**: Merged user and technical documentation
- ✅ **Code optimization**: Streamlined TypeScript interface with hierarchical support
- ✅ **Error handling**: Added robust fallbacks for missing YAML data
