/**
 * Type definitions for the Star Wars Galaxies shipwright inventory management system.
 *
 * This module contains all TypeScript type definitions, interfaces, and constants
 * used throughout the application for managing starship component inventory,
 * schematics, and related business logic.
 */

/** Mark level representing component quality/tier (I=Light, II=Mid-Grade, III=Heavy, IV=Advanced, V=Experimental) */
export type MarkLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Part categories for starship components */
export type PartCategory =
	| 'Armor'
	| 'Booster'
	| 'Capacitor'
	| 'Droid Interface'
	| 'Engine'
	| 'Reactor'
	| 'Shield'
	| 'Blaster (Green)'
	| 'Blaster (Red)';

/** Represents a single inventory item with category, mark level, and quantity */
export interface InventoryItem {
	category: PartCategory;
	markLevel: MarkLevel;
	quantity: number;
}

/** Represents a single inventory item with update timestamp */
export interface InventoryItemWithTimestamp {
	category: PartCategory;
	markLevel: MarkLevel;
	quantity: number;
	updatedAt: string;
}

/**
 * Inventory object mapping component keys to quantities.
 * Key format: `${category}-${markLevel}` (e.g., "Armor-I", "Engine-V")
 */
export type Inventory = Record<string, number>;

/** Application settings interface */
export interface Settings {
	recommendedStockLevel: number;
	sellValues: Record<MarkLevel, number>;
}

/** Schematic data structure from SWGAide XML exports */
export interface Schematic {
	id: string;
	name: string;
	category: string;
	profession: string;
	complexity: number;
	datapad: number;
	ingredients: SchematicIngredient[];
	resources: SchematicResource[];
}

/** Ingredient required for a schematic */
export interface SchematicIngredient {
	name: string;
	amount: number;
	units: string;
}

/** Resource required for a schematic */
export interface SchematicResource {
	name: string;
	amount: number;
	units: string;
	classes: string[];
}

export const MARK_LEVELS: MarkLevel[] = ['I', 'II', 'III', 'IV', 'V'];

/** Array of all available part categories */
export const PART_CATEGORIES: PartCategory[] = [
	'Armor',
	'Booster',
	'Capacitor',
	'Droid Interface',
	'Engine',
	'Reactor',
	'Shield',
	'Blaster (Green)',
	'Blaster (Red)'
];

/**
 * Generates an inventory key from category and mark level.
 * @param category - The part category
 * @param markLevel - The mark level
 * @returns Formatted key string for inventory lookups
 */
export function getInventoryKey(category: PartCategory, markLevel: MarkLevel): string {
	return `${category}-${markLevel}`;
}

/**
 * Gets the proper blaster display name based on mark level and color.
 * Converts mark levels to descriptive names (I=Light, II=Mid-Grade, etc.)
 * @param markLevel - The mark level (I-V)
 * @param color - The blaster color (Green or Red)
 * @returns Formatted blaster name
 */
export function getBlasterName(markLevel: MarkLevel, color: 'Green' | 'Red'): string {
	const blasterTypes = {
		I: 'Light Blaster',
		II: 'Mid-Grade Blaster',
		III: 'Heavy Blaster',
		IV: 'Advanced Blaster',
		V: 'Experimental Blaster'
	};
	return `${blasterTypes[markLevel]} (${color})`;
}

/** Mapping of inventory categories to their corresponding schematic category IDs */
export const SCHEMATIC_CATEGORY_MAP: Record<PartCategory, string> = {
	Armor: '1385',
	Booster: '1386',
	Capacitor: '1387',
	'Droid Interface': '1383',
	Engine: '1388',
	Reactor: '1389',
	Shield: '1390',
	'Blaster (Green)': '1381',
	'Blaster (Red)': '1381'
};

// Specific schematic ID mapping for each component and mark level
export const SCHEMATIC_ID_MAP: Record<string, string> = {
	// Engines
	'Engine-I': '2907',
	'Engine-II': '2925',
	'Engine-III': '2939',
	'Engine-IV': '2948',
	'Engine-V': '2955',

	// Reactors
	'Reactor-I': '2896',
	'Reactor-II': '2915',
	'Reactor-III': '2933',
	'Reactor-IV': '2945',
	'Reactor-V': '2954',

	// Shields
	'Shield-I': '2904',
	'Shield-II': '2912',
	'Shield-III': '2930',
	'Shield-IV': '2942',
	'Shield-V': '2951',

	// Armor
	'Armor-I': '2895',
	'Armor-II': '2914',
	'Armor-III': '2932',
	'Armor-IV': '2944',
	'Armor-V': '2953',

	// Capacitors
	'Capacitor-I': '2908',
	'Capacitor-II': '2926',
	'Capacitor-III': '2940',
	'Capacitor-IV': '2949',
	'Capacitor-V': '2956',

	// Boosters
	'Booster-I': '2891',
	'Booster-II': '2909',
	'Booster-III': '2927',
	'Booster-IV': '2941',
	'Booster-V': '2950',

	// Droid Interfaces
	'Droid Interface-I': '2894',
	'Droid Interface-II': '2913',
	'Droid Interface-III': '2931',
	'Droid Interface-IV': '2943',
	'Droid Interface-V': '2952',

	// Blasters (Green)
	'Blaster (Green)-I': '2876',
	'Blaster (Green)-II': '2973',
	'Blaster (Green)-III': '2845',
	'Blaster (Green)-IV': '2634',
	'Blaster (Green)-V': '2810',

	// Blasters (Red)
	'Blaster (Red)-I': '2877',
	'Blaster (Red)-II': '2974',
	'Blaster (Red)-III': '2846',
	'Blaster (Red)-IV': '2635',
	'Blaster (Red)-V': '2811'
};

/**
 * Calculates the total value of the inventory based on sell values
 * @param inventory - The current inventory state
 * @param sellValues - The sell values for each mark level
 * @returns The total value of all inventory items
 */
export function calculateInventoryValue(
	inventory: Inventory,
	sellValues: Record<MarkLevel, number>
): number {
	let totalValue = 0;

	for (const [key, quantity] of Object.entries(inventory)) {
		const [category, markLevel] = key.split('-') as [PartCategory, MarkLevel];
		const sellValue = sellValues[markLevel] || 0;
		totalValue += quantity * sellValue;
	}

	return totalValue;
}

/**
 * Calculates the value of inventory for a specific mark level
 * @param inventory - The current inventory state
 * @param markLevel - The mark level to calculate for
 * @param sellValue - The sell value for this mark level
 * @returns The total value for this mark level
 */
export function calculateMarkLevelValue(
	inventory: Inventory,
	markLevel: MarkLevel,
	sellValue: number
): number {
	let totalQuantity = 0;

	for (const [key, quantity] of Object.entries(inventory)) {
		if (key.endsWith(`-${markLevel}`)) {
			totalQuantity += quantity;
		}
	}

	return totalQuantity * sellValue;
}
