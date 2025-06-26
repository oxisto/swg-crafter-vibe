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

## Current Implementation (COMPLETED & SIMPLIFIED)

### Active Files

- `src/lib/data/resource-functions.ts` - Simple database-driven resource interface
- `src/lib/data/resource-tree-importer.ts` - XML importer and database functions
- `src/lib/data/resourcetree2.xml` - Canonical SWG resource tree (816 resources)
- `src/routes/schematics/[id]/+page.svelte` - Uses the functions for schematic display

### Removed Files (Cleanup Completed)

- ~~`resource-class-mapping.ts`~~ - Complex legacy mapping with YAML fallbacks (removed)
- ~~`resource-class-hierarchy.yaml`~~ - Manual YAML hierarchy (removed, replaced by XML import)
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

| Code  | Full Name   | Category | Description                                          |
| ----- | ----------- | -------- | ---------------------------------------------------- |
| `stl` | Steel       | Metal    | High-strength steel alloys for structural components |
| `rad` | Radioactive | Chemical | Radioactive materials for energy cores and reactors  |
| `ine` | Inert Gas   | Gas      | Inert gases for cooling and protective atmospheres   |
| `pol` | Polymer     | Chemical | Synthetic polymer compounds for insulation           |
| `alu` | Aluminum    | Metal    | Lightweight aluminum alloys for frames and casings   |
| `cop` | Copper      | Metal    | Conductive copper alloys for electrical components   |
| `irn` | Iron        | Metal    | Basic iron alloys for general construction           |

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
  name: 'Inorganic'
  children:
    metal:
      name: 'Metal'
      children:
        # Resource codes are keys at leaf nodes
        stl:
          name: 'Steel'
        alu:
          name: 'Aluminum'
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

### Simple Database-Driven Approach (Current)

```typescript
import {
	getResourceInfo,
	getResourceDisplayName,
	formatResourceClasses
} from '$lib/data/resource-functions';

// Get detailed resource information from database
const resourceInfo = getResourceInfo('stl');
// Returns: { name: 'Steel', category: 'Inorganic', path: 'inorganic.metal.ferrous.steel', description: 'Steel (ID: 161)' }

// Get just the display name
const displayName = getResourceDisplayName('stl'); // Returns: "Steel"

// Format multiple resource classes
const formatted = formatResourceClasses(['stl', 'alu', 'rad']); // Returns: "Steel, Aluminum, Radioactive"
```

### Legacy Compatibility

```typescript
import { getResourceClassInfo, getResourceClassName } from '$lib/data/resource-functions';

// Legacy functions still work
const resourceInfo = getResourceClassInfo('stl'); // Returns: { name: 'Steel', category: 'Unknown' }
const name = getResourceClassName('stl'); // Returns: "Steel"
```

## Data Sources

The comprehensive resource data is now automatically imported from:

- **`resourcetree2.xml`** - Canonical SWG resource tree with 816 resources
- **Hierarchical structure** - Complete parent-child relationships
- **Resource statistics** - Full stat ranges (OQ, PE, DR, FL, HR, MA, CD, CR, SH, UT, SR)
- **Resource metadata** - IDs, flags (recycled, harvested), descriptions

## Completed Implementation ✅

### Final Phase: Database-Driven System (COMPLETED)

- ✅ **Automatic XML import**: 816 resources from canonical source
- ✅ **Database storage**: SQLite table with full hierarchy and stats
- ✅ **Simplified interface**: Clean TypeScript functions without legacy overhead
- ✅ **Complete resource data**: IDs, stat ranges, parent-child relationships
- ✅ **Automatic startup import**: Checks for updates and imports seamlessly
- ✅ **Legacy cleanup**: Removed complex YAML and mapping files

### Previous Phases (COMPLETED)

- ✅ **Core TypeScript mapping**: Essential resource classes implemented
- ✅ **YAML hierarchy structure**: Clean, maintainable tree using codes as keys
- ✅ **Schematic integration**: Resource names displayed instead of codes
- ✅ **Tooltip removal**: Simplified, cleaner UI as requested
- ✅ **Backward compatibility**: Legacy flat mapping still supported
- ✅ **Hierarchical lookup functions**: Tree traversal and search
- ✅ **Category-based filtering**: Support for organizing by resource type
- ✅ **Clean code structure**: Removed redundancy and descriptions
- ✅ **TypeScript interface**: Proper type definitions and error handling

## System Complete 🎉

The resource class mapping system has been **completely modernized** and now provides:

- **816 comprehensive resources** from canonical source
- **Automatic import and updates** on startup
- **Simple, clean interface** with database-driven performance
- **Full backward compatibility** for existing code
- **Zero maintenance overhead** - no manual mapping updates needed

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
