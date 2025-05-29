# Schematics API Analysis for Inventory Management

## Summary of Ship Component Categories Found

Based on exploration of the SWGAide schematics API, here are the relevant categories and their corresponding inventory items:

### 🚀 **Ship Component Categories**

| Inventory Category | Schematic Category | Mark Levels Available | Sample Schematic IDs |
|-------------------|-------------------|---------------------|---------------------|
| **Engine** | 1388 | I-V | 2907, 2925, 2939, 2948, 2955 |
| **Reactor** | 1389 | I-V | 2896, 2915, 2933, 2945, 2954 |
| **Shield** | 1390 | I-V | 2904, 2912, 2930, 2942, 2951 |
| **Armor** | 1385 | I-V | 2895, 2914, 2932, 2944, 2953 |
| **Capacitor** | 1387 | I-V | 2908, 2926, 2940, 2949, 2956 |
| **Booster** | 1386 | I-V | 2891, 2909, 2927, 2941, 2950 |
| **Droid Interface** | 1383 | I-V | 2894, 2913, 2931, 2943, 2952 |
| **Blaster (Green)** | 1381 | I-V | 2876, 2973, 2845, 2634, 2810 |
| **Blaster (Red)** | 1381 | I-V | 2877, 2974, 2846, 2635, 2811 |

### 📝 **Complete Mark Level Component Lists**

#### Engines (Category 1388)
- Mark I Starfighter Engine (ID: 2907)
- Mark II Starfighter Engine (ID: 2925)
- Mark III Starfighter Engine (ID: 2939)
- Mark IV Starfighter Engine (ID: 2948)
- Mark V Starfighter Engine (ID: 2955)

#### Reactors (Category 1389)
- Mark I Fusion Reactor (ID: 2896)
- Mark II Fusion Reactor (ID: 2915)
- Mark III Fusion Reactor (ID: 2933)
- Mark IV Fusion Reactor (ID: 2945)
- Mark V Fusion Reactor (ID: 2954)

#### Shields (Category 1390)
- Mark I Shield Generator (ID: 2904)
- Mark II Deflector Shield Generator (ID: 2912)
- Mark III Deflector Shield Generator (ID: 2930)
- Mark IV Deflector Shield Generator (ID: 2942)
- Mark V Deflector Shield Generator (ID: 2951)

#### Armor (Category 1385)
- Mark I Durasteel Plating (ID: 2895)
- Mark II Durasteel Plating (ID: 2914)
- Mark III Durasteel Plating (ID: 2932)
- Mark IV Durasteel Plating (ID: 2944)
- Mark V Durasteel Plating (ID: 2953)

#### Capacitors (Category 1387)
- Mark I Weapons Capacitor (ID: 2908)
- Mark II Weapons Capacitor (ID: 2926)
- Mark III Weapons Capacitor (ID: 2940)
- Mark IV Weapons Capacitor (ID: 2949)
- Mark V Weapons Capacitor (ID: 2956)

#### Boosters (Category 1386)
- Mark I Booster (ID: 2891)
- Mark II Booster (ID: 2909)
- Mark III Booster (ID: 2927)
- Mark IV Booster (ID: 2941)
- Mark V Booster (ID: 2950)

#### Droid Interfaces (Category 1383)
- Mark I Droid Interface (ID: 2894)
- Mark II Droid Interface (ID: 2913)
- Mark III Droid Interface (ID: 2931)
- Mark IV Droid Interface (ID: 2943)
- Mark V Droid Interface (ID: 2952)

#### Blasters - Green (Category 1381)
- Mark I: Light Blaster (Green) (ID: 2876)
- Mark II: Mid-Grade Blaster (Green) (ID: 2973)
- Mark III: Heavy Blaster (Green) (ID: 2845)
- Mark IV: Advanced Blaster (Green) (ID: 2634)
- Mark V: Experimental Blaster (Green) (ID: 2810)

#### Blasters - Red (Category 1381)
- Mark I: Light Blaster (Red) (ID: 2877)
- Mark II: Mid-Grade Blaster (Red) (ID: 2974)
- Mark III: Heavy Blaster (Red) (ID: 2846)
- Mark IV: Advanced Blaster (Red) (ID: 2635)
- Mark V: Experimental Blaster (Red) (ID: 2811)

### 🔧 **API Endpoints Available**

Your SvelteKit application already has these endpoints set up:

1. **Get All Schematics**: `GET /api/schematics`
2. **Get by Category**: `GET /api/schematics?category=1388`
3. **Get by ID**: `GET /api/schematics?id=2907`

### 💡 **Integration Opportunities**

Now that you have the schematic IDs that correspond to your inventory items, you can:

1. **Enhanced Inventory Display**: Show schematic names alongside inventory quantities
2. **Production Planning**: Calculate what ships can be built with current inventory
3. **Shopping Lists**: Generate lists of components needed for specific ships
4. **Schematics Browser**: Filter and search schematics by component type and mark level
5. **Cost Analysis**: If you add pricing data, calculate material costs for ships

### 🎯 **Mapping Examples**

For your inventory key format `${category}-${markLevel}`, you can now map to:

**Engine Example:**
- Inventory Key: "Engine-III" 
- Category: 1388 (Engine)
- Schematic ID: 2939 (Mark III Starfighter Engine)

**Blaster Examples:**
- Inventory Key: "Blaster (Green)-IV"
- Category: 1381 (Blasters)
- Schematic ID: 2634 (Advanced Blaster (Green))

- Inventory Key: "Blaster (Red)-I"
- Category: 1381 (Blasters) 
- Schematic ID: 2877 (Light Blaster (Red))

This allows you to provide rich contextual information about what each inventory item is used for in ship construction.

### 📊 **Next Steps**

Consider implementing:
1. A mapping table in your database linking inventory keys to schematic IDs
2. API endpoints that combine inventory data with schematic information
3. UI components that show both current stock and what each component is used for
4. Production calculators that use both inventory and schematic data

### 🔄 **Recent Changes Made**

**✅ Updated Inventory Structure:**
- Split "Weapon" category into "Blaster (Green)" and "Blaster (Red)"
- Updated TypeScript types in `src/lib/types.ts`
- Migrated existing database records from "Weapon" to new blaster categories
- Inventory grid now shows 9×5 layout (was 8×5) with separate green/red blaster rows

**✅ Added Helper Functions:**
- `getBlasterName()` - Maps mark levels to proper blaster names (Light, Mid-Grade, Heavy, Advanced, Experimental)
- `SCHEMATIC_CATEGORY_MAP` - Maps inventory categories to schematic categories
- `SCHEMATIC_ID_MAP` - Direct mapping from inventory keys to specific schematic IDs

**✅ Database Migration:**
- Automatically converted existing "Weapon" entries to both "Blaster (Green)" and "Blaster (Red)"
- Preserved existing quantities and timestamps
- No data loss during migration
