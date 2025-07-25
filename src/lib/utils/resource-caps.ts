/**
 * Resource utility functions for frontend use
 * These functions perform calculations without database access
 */

import type { ResourceCaps } from '$lib/types/resources.js';

/**
 * Apply resource caps to a resource's attributes based on its class
 * Uses hardcoded caps - for database caps, use API endpoints
 * @param attributes - Raw resource attributes
 * @param resourceClass - Resource class code (e.g., 'irn', 'stl', 'rad')
 * @returns Capped attributes
 */
export function applyResourceCaps(
	attributes: Record<string, number>,
	resourceClass: string
): Record<string, number> {
	// Hardcoded caps for common resource classes
	const RESOURCE_CAPS: Record<string, ResourceCaps> = {
		// Metal caps
		irn: {
			// Iron
			cr: 600,
			cd: 500,
			dr: 1000,
			fl: 0,
			hr: 1000,
			ma: 1000,
			pe: 0,
			oq: 1000,
			sr: 1000,
			ut: 1000,
			er: 0
		},
		stl: {
			// Steel
			cr: 800,
			cd: 1000,
			dr: 600,
			fl: 0,
			hr: 400,
			ma: 1000,
			pe: 0,
			oq: 1000,
			sr: 600,
			ut: 1000,
			er: 0
		},
		alu: {
			// Aluminum
			cr: 700,
			cd: 1000,
			dr: 400,
			fl: 0,
			hr: 500,
			ma: 1000,
			pe: 0,
			oq: 1000,
			sr: 300,
			ut: 1000,
			er: 0
		},
		cop: {
			// Copper
			cr: 1000,
			cd: 1000,
			dr: 200,
			fl: 0,
			hr: 300,
			ma: 500,
			pe: 0,
			oq: 1000,
			sr: 200,
			ut: 600,
			er: 0
		},
		// Chemical caps
		rad: {
			// Radioactive
			cr: 0,
			cd: 0,
			dr: 500,
			fl: 0,
			hr: 0,
			ma: 0,
			pe: 1000,
			oq: 1000,
			sr: 0,
			ut: 0,
			er: 0
		},
		pol: {
			// Polymer
			cr: 0,
			cd: 600,
			dr: 500,
			fl: 0,
			hr: 1000,
			ma: 1000,
			pe: 500,
			oq: 1000,
			sr: 1000,
			ut: 800,
			er: 0
		},
		// Gas caps
		ine: {
			// Inert Gas
			cr: 0,
			cd: 0,
			dr: 1000,
			fl: 0,
			hr: 0,
			ma: 0,
			pe: 1000,
			oq: 1000,
			sr: 0,
			ut: 0,
			er: 0
		},
		rea: {
			// Reactive Gas
			cr: 0,
			cd: 0,
			dr: 500,
			fl: 0,
			hr: 0,
			ma: 0,
			pe: 1000,
			oq: 1000,
			sr: 0,
			ut: 0,
			er: 0
		}
	};

	const caps = RESOURCE_CAPS[resourceClass.toLowerCase()];
	if (!caps) {
		// No caps defined for this class, return original attributes
		return { ...attributes };
	}

	const capped: Record<string, number> = {};

	for (const [stat, value] of Object.entries(attributes)) {
		const cap = caps[stat as keyof ResourceCaps];
		if (cap !== undefined) {
			// Apply cap: if cap is 0, stat should be 0; otherwise min(value, cap)
			capped[stat] = cap === 0 ? 0 : Math.min(value, cap);
		} else {
			// No cap for this stat, keep original value
			capped[stat] = value;
		}
	}

	return capped;
}

/**
 * Get the resource class from a schematic resource requirement
 * @param classes - Array of resource class requirements
 * @returns The most specific class code, or empty string if none found
 */
export function getResourceClassCode(
	classes: (string | { code: string; displayName: string })[]
): string {
	if (!classes || classes.length === 0) return '';

	const firstClass = classes[0];
	return typeof firstClass === 'string' ? firstClass : firstClass.code || '';
}

/**
 * Normalize resource stats by dividing by their caps for the given resource class
 * This gives a 0.0 to 1.0 ratio representing how good each stat is relative to its max
 * @param attributes - Raw resource attributes
 * @param resourceClassCaps - The stat caps for the resource class
 * @returns Normalized attributes (0.0 to 1.0)
 */
export function normalizeResourceStats(
	attributes: Record<string, number>,
	resourceClassCaps: ResourceCaps
): Record<string, number> {
	const normalized: Record<string, number> = {};

	for (const [stat, value] of Object.entries(attributes)) {
		const cap = resourceClassCaps[stat as keyof ResourceCaps];
		if (cap && cap > 0) {
			// Normalize: divide the stat value by its cap to get a 0.0-1.0 ratio
			normalized[stat] = Math.min(1.0, value / cap);
		} else {
			// No cap or cap is 0, can't normalize
			normalized[stat] = 0;
		}
	}

	return normalized;
}

/**
 * Get resource class caps from API (frontend-safe)
 * @param classCode - Resource class code
 * @returns Promise resolving to resource caps
 */
export async function getResourceClassCaps(classCode: string): Promise<ResourceCaps> {
	try {
		const response = await fetch(`/api/resource-classes/${encodeURIComponent(classCode)}/caps`);
		if (!response.ok) {
			console.warn(`Failed to fetch caps for class: ${classCode}`);
			return {};
		}
		return await response.json();
	} catch (error) {
		console.warn(`Error fetching caps for class: ${classCode}`, error);
		return {};
	}
}
