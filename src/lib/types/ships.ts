/**
 * Ship and loadout type definitions for the Star Wars Galaxies shipwright system.
 * Contains types for ship chassis, loadouts, and ship management.
 */

import type { MarkLevel } from './inventory.js';

/**
 * Ship loadout representing a complete ship configuration for sale
 */
export interface ShipLoadout {
	id: string;
	name: string;
	shipType: string;
	variant?: string; // e.g., "High Mass Variant"
	markLevel: MarkLevel;
	price: number;
	quantity: number;
	schematicId?: string; // Optional connection to ship schematic
	description?: string;
	updatedAt?: string;
}

/**
 * Ship chassis representing a base ship frame for assembly
 * @deprecated Use `Chassis` instead
 */
export interface ShipChassis {
	id: string;
	name: string;
	shipType: string;
	variant?: string; // e.g., "High Mass Variant"
	price: number;
	quantity: number;
	schematicId?: string; // Optional connection to chassis schematic
	description?: string;
	updatedAt?: string;
}

/**
 * Ship chassis representing a base ship frame for assembly
 */
export interface Chassis {
	id: string;
	name: string;
	shipType: string;
	variant?: string; // e.g., "High Mass Variant"
	price: number;
	quantity: number;
	schematicId?: string; // Optional connection to chassis schematic
	description?: string;
	updatedAt?: string;
}

/**
 * Ship types available in the game
 */
export type ShipType = 'Scyk';

/**
 * Default ship chassis available for purchase
 */
export const SHIP_CHASSIS: Chassis[] = [
	{
		id: 'scyk-high-mass-chassis',
		name: 'Scyk High Mass Variant Chassis',
		shipType: 'Scyk',
		variant: 'High Mass Variant',
		price: 195000,
		quantity: 0,
		schematicId: '3016',
		description: 'Base chassis frame for Scyk High Mass Variant - components sold separately'
	}
];

/**
 * Default ship loadouts available for purchase
 */
export const SHIP_LOADOUTS: ShipLoadout[] = [
	{
		id: 'scyk-hmv-i',
		name: 'Scyk High Mass Variant Mark I Loadout',
		shipType: 'Scyk',
		variant: 'High Mass Variant',
		markLevel: 'I',
		price: 75000,
		quantity: 1,
		description: 'Basic Mark I loadout for Scyk High Mass Variant with standard components'
	},
	{
		id: 'scyk-hmv-ii',
		name: 'Scyk High Mass Variant Mark II Loadout',
		shipType: 'Scyk',
		variant: 'High Mass Variant',
		markLevel: 'II',
		price: 150000,
		quantity: 0,
		description: 'Complete Mark II loadout for Scyk High Mass Variant with balanced components'
	},
	{
		id: 'scyk-hmv-iii',
		name: 'Scyk High Mass Variant Mark III Loadout',
		shipType: 'Scyk',
		variant: 'High Mass Variant',
		markLevel: 'III',
		price: 350000,
		quantity: 1,
		description: 'Advanced Mark III loadout for Scyk High Mass Variant with high-quality components'
	}
];

/**
 * Calculates the total value of all ship loadouts based on their quantities and prices
 * @param loadouts - Array of ship loadouts
 * @returns The total value of all loadouts
 */
export function calculateLoadoutsValue(loadouts: ShipLoadout[]): number {
	return loadouts.reduce((totalValue, loadout) => {
		return totalValue + loadout.quantity * loadout.price;
	}, 0);
}

/**
 * Generates a loadout key from ship type, variant, and mark level.
 * @param shipType - The ship type
 * @param variant - The ship variant (optional)
 * @param markLevel - The mark level
 * @returns Formatted key string for loadout lookups
 */
export function getLoadoutKey(
	shipType: ShipType,
	variant: string | undefined,
	markLevel: MarkLevel
): string {
	const baseKey = variant
		? `${shipType.toLowerCase()}-${variant.toLowerCase().replace(/\s+/g, '-')}`
		: shipType.toLowerCase();
	return `${baseKey}-${markLevel.toLowerCase()}`;
}
