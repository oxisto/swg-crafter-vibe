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

/** Raw mail data from mail analyzer tool */
export interface MailData {
	mail_id: string;
	sender: string;
	subject: string;
	timestamp: string;
	body: string;
	location?: string;
}

/** Sales data extracted and categorized from mail */
export interface Sale {
	id?: number;
	mail_id: string;
	timestamp: string;
	item_name: string;
	buyer: string;
	credits: number;
	location?: string;
	category?: PartCategory;
	mark_level?: MarkLevel;
	created_at?: string;
}

/** Mail import batch statistics */
export interface MailImport {
	id?: number;
	batch_id: string;
	total_mails: number;
	imported_mails: number;
	start_date?: string;
	end_date?: string;
	imported_at?: string;
}

/** Mail batch data from analyzer tool */
export interface MailBatch {
	mails: MailData[];
	stats: MailStats;
}

/** Statistics about parsed mail batch */
export interface MailStats {
	total_mails: number;
	date_range: {
		start_date: string;
		end_date: string;
	};
	senders: Record<string, number>;
}

/** Sales analytics for dashboard */
export interface SalesAnalytics {
	totalSales: number;
	totalCredits: number;
	averagePrice: number;
	salesByCategory: Record<PartCategory, number>;
	salesByMarkLevel: Record<MarkLevel, number>;
	creditsOverTime: Array<{ date: string; credits: number }>;
}

/** Resource data structure for current resources from SWGAide exports */
export interface Resource {
	id: number;
	name: string;
	type: string;
	className: string;
	classPath?: string[];
	attributes: ResourceAttributes;
	planetDistribution: Record<string, number>;
	enterDate: string;
	despawnDate?: string;
	isCurrentlySpawned: boolean;
	soapLastUpdated?: string;
	stats?: ResourceStats;
}

/** Resource attribute values */
export interface ResourceAttributes {
	cr?: number;
	cd?: number;
	dr?: number;
	fl?: number;
	hr?: number;
	ma?: number;
	pe?: number;
	oq?: number;
	sr?: number;
	ut?: number;
	er?: number;
}

/** Statistics about resource quality and distribution */
export interface ResourceStats {
	overallQuality: number;
	bestUses: string[];
	averageConcentration: number;
}

/** Planets in SWG Restoration III */
export type Planet =
	| 'corellia'
	| 'dantooine'
	| 'dathomir'
	| 'endor'
	| 'lok'
	| 'naboo'
	| 'rori'
	| 'talus'
	| 'tatooine'
	| 'yavin4'
	| 'kashyyyk_main'
	| 'kashyyyk_hunting'
	| 'kashyyyk_dead'
	| 'mustafar'
	| 'space';

/** Array of all available planets */
export const PLANETS: Planet[] = [
	'corellia',
	'dantooine',
	'dathomir',
	'endor',
	'lok',
	'naboo',
	'rori',
	'talus',
	'tatooine',
	'yavin4',
	'kashyyyk_main',
	'kashyyyk_hunting',
	'kashyyyk_dead',
	'mustafar',
	'space'
];

/** Planet display information for location columns */
export interface PlanetInfo {
	letter: string;
	color: string;
	bg: string;
	name: string;
}

/** Planet data with single letters and colors matching the galaxy map */
export const PLANET_DATA: Record<string, PlanetInfo> = {
	corellia: { letter: 'C', color: 'text-blue-300', bg: 'bg-blue-900/40', name: 'Corellia' },
	dantooine: { letter: 'D', color: 'text-purple-300', bg: 'bg-purple-900/40', name: 'Dantooine' },
	dathomir: { letter: 'D', color: 'text-orange-300', bg: 'bg-orange-900/40', name: 'Dathomir' },
	endor: { letter: 'E', color: 'text-emerald-300', bg: 'bg-emerald-900/40', name: 'Endor' },
	lok: { letter: 'L', color: 'text-yellow-100', bg: 'bg-yellow-400/40', name: 'Lok' },
	naboo: { letter: 'N', color: 'text-cyan-300', bg: 'bg-cyan-900/40', name: 'Naboo' },
	rori: { letter: 'R', color: 'text-teal-300', bg: 'bg-teal-900/40', name: 'Rori' },
	talus: { letter: 'T', color: 'text-green-400', bg: 'bg-green-800/40', name: 'Talus' },
	tatooine: { letter: 'T', color: 'text-yellow-400', bg: 'bg-yellow-900/40', name: 'Tatooine' },
	yavin4: { letter: 'Y', color: 'text-green-300', bg: 'bg-green-700/40', name: 'Yavin 4' },
	kashyyyk_main: {
		letter: 'K',
		color: 'text-amber-300',
		bg: 'bg-amber-900/40',
		name: 'Kashyyyk Main'
	},
	kashyyyk_hunting: {
		letter: 'H',
		color: 'text-amber-200',
		bg: 'bg-amber-800/40',
		name: 'Kashyyyk Hunting'
	},
	kashyyyk_dead: {
		letter: 'W',
		color: 'text-amber-400',
		bg: 'bg-amber-700/40',
		name: 'Kashyyyk Dead Forest'
	},
	mustafar: { letter: 'M', color: 'text-red-400', bg: 'bg-red-800/40', name: 'Mustafar' },
	space: { letter: 'S', color: 'text-slate-300', bg: 'bg-slate-700/40', name: 'Space' }
};

/**
 * Gets planet display information for a given planet name.
 * @param planetName - The planet name to look up
 * @returns Planet display information with letter, colors, and full name
 */
export function getPlanetInfo(planetName: string): PlanetInfo {
	if (!planetName) return { letter: '', color: 'text-slate-300', bg: 'bg-slate-700/40', name: '' };
	const normalized = planetName.toLowerCase().replace(/\s+/g, '_');
	return (
		PLANET_DATA[normalized] || {
			letter: planetName.charAt(0).toUpperCase(),
			color: 'text-slate-300',
			bg: 'bg-slate-700/40',
			name: planetName
		}
	);
}

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
 * Ship types available in the game
 */
export type ShipType = 'Scyk';

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
