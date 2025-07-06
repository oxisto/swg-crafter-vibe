/**
 * Resource-related type definitions for the Star Wars Galaxies shipwright system.
 * Contains types for resources, planets, and resource management.
 */

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
	inventory?: ResourceInventoryItem | null;
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

/** Resource stat caps for different resource classes */
export interface ResourceCaps {
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

/** Resource inventory amount categories */
export type ResourceInventoryAmount =
	| 'none' // 0
	| 'very_low' // < 10k
	| 'low' // 10k - 100k
	| 'medium' // 100k - 500k
	| 'high' // 500k - 1M
	| 'very_high'; // > 1M

/** Resource inventory entry for tracking owned resources */
export interface ResourceInventoryItem {
	resourceId: number;
	amount: ResourceInventoryAmount;
	notes?: string;
	lastUpdated: string;
	createdAt: string;
}

/** Resource inventory amount display information */
export interface ResourceInventoryAmountInfo {
	value: ResourceInventoryAmount;
	label: string;
	description: string;
	color: string;
	sortOrder: number;
}
