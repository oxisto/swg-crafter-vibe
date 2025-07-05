/**
 * Schematic and crafting-related type definitions for the Star Wars Galaxies shipwright system.
 * Contains types for schematics, components, and crafting calculations.
 */

import type { PartCategory } from './inventory.js';

/** Component required for a schematic (sub-components that must be crafted or obtained) */
export interface SchematicComponent {
	name: string;
	amount: number;
	units: string;
}

/** Resource required for a schematic */
export interface SchematicResource {
	name: string;
	amount: number;
	units: string;
	classes: (string | { code: string; displayName: string })[];
}

/** Experimentation property for a schematic */
export interface ExperimentationProperty {
	desc: string; // Description like "Engine Speed", "Mass/Armor/Hitpoints", etc.
	cd?: number; // Conductivity percentage
	oq?: number; // Overall Quality percentage
	ut?: number; // Unit Toughness percentage
	sr?: number; // Shock Resistance percentage
	pe?: number; // Potential Energy percentage
	hr?: number; // Heat Resistance percentage
	ma?: number; // Malleability percentage
}

/** Experimentation group for a schematic */
export interface ExperimentationGroup {
	desc: string; // Group description like "Experimental Speed", "Experimental Mass/Armor/Hitpoints"
	properties: ExperimentationProperty[];
}

/** Schematic data structure from SWGAide XML exports */
export interface Schematic {
	id: string;
	name: string;
	category: string;
	profession: string;
	complexity: number;
	datapad: number;
	is_favorite?: boolean;
	components: SchematicComponent[];
	resources: SchematicResource[];
	experimentation?: ExperimentationGroup[]; // Added experimentation properties
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
