/**
 * Inventory management type definitions for the Star Wars Galaxies shipwright system.
 * Contains all types related to starship component inventory tracking.
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
