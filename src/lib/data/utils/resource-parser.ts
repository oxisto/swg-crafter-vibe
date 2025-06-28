/**
 * Resource Data Processing Utilities
 *
 * Utility functions for processing and transforming resource data
 * from raw XML format to structured database format.
 */

import { dbLogger } from '../database.js';

/**
 * Extracts resource attributes from raw XML stats object
 * @param rawResource - Raw resource data from XML
 * @returns Extracted attributes as key-value pairs
 */
export function extractResourceAttributes(rawResource: any): Record<string, number> {
	const attributes: Record<string, number> = {};

	if (!rawResource.stats) {
		return attributes;
	}

	const attributeNames = ['cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'oq', 'sr', 'ut', 'er'];

	for (const attr of attributeNames) {
		if (rawResource.stats[attr] !== undefined) {
			attributes[attr] = parseInt(rawResource.stats[attr], 10);
		}
	}

	return attributes;
}

/**
 * Extracts planet distribution from raw XML planets object
 * @param rawResource - Raw resource data from XML
 * @returns Planet distribution as key-value pairs
 */
export function extractPlanetDistribution(rawResource: any): Record<string, number> {
	const planetDistribution: Record<string, number> = {};

	if (!rawResource.planets?.planet) {
		return planetDistribution;
	}

	const planets = Array.isArray(rawResource.planets.planet)
		? rawResource.planets.planet
		: [rawResource.planets.planet];

	for (const planet of planets) {
		if (planet.name) {
			// For now, assume equal distribution. Real concentrations would need waypoint data
			planetDistribution[planet.name] = 100;
		}
	}

	return planetDistribution;
}

/**
 * Builds class path from resource type
 * @param resourceType - The resource type string
 * @returns Array of class path elements
 */
export function buildClassPath(resourceType: string): string[] {
	return resourceType ? resourceType.split(' ') : [];
}

/**
 * Validates resource ID from raw XML data
 * @param rawResource - Raw resource data from XML
 * @returns Parsed and validated resource ID, or null if invalid
 */
export function validateResourceId(rawResource: any): number | null {
	if (!rawResource._swgaide_id) {
		return null;
	}

	const resourceId = parseInt(rawResource._swgaide_id, 10);

	// Skip if ID is not a valid positive integer
	if (isNaN(resourceId) || resourceId <= 0) {
		dbLogger.error(
			`Invalid resource ID detected: ${rawResource._swgaide_id} (expected integer, got invalid value)`
		);
		return null;
	}

	return resourceId;
}

/**
 * Processes a single resource from raw XML data
 * @param rawResource - Raw resource data from XML
 * @param currentTime - Current timestamp string
 * @returns Processed resource data ready for database insertion/update, or null if invalid
 */
export function processResourceData(rawResource: any, currentTime: string) {
	if (!rawResource?.name) {
		return null;
	}

	const resourceId = validateResourceId(rawResource);
	if (resourceId === null) {
		return null;
	}

	const attributes = extractResourceAttributes(rawResource);
	const planetDistribution = extractPlanetDistribution(rawResource);
	const classPath = buildClassPath(rawResource.type || '');

	// Calculate simple stats (note: these function imports would need to be added)
	const stats = {
		overallQuality: calculateOverallQuality(attributes),
		bestUses: calculateBestUses(attributes, rawResource.type || ''),
		averageConcentration: calculateAverageConcentration(planetDistribution)
	};

	return {
		id: resourceId,
		name: rawResource.name,
		type: rawResource.type || '',
		className: rawResource.type || '', // Using type as class_name for now
		classPath: JSON.stringify(classPath),
		attributes: JSON.stringify(attributes),
		planetDistribution: JSON.stringify(planetDistribution),
		enterDate: currentTime,
		stats: JSON.stringify(stats)
	};
}

// Helper functions that would be imported from elsewhere or implemented
function calculateOverallQuality(attributes: Record<string, number>): number {
	// Simple average of all attributes
	const values = Object.values(attributes);
	return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
}

function calculateBestUses(attributes: Record<string, number>, type: string): string[] {
	// Simplified - would need proper logic based on resource type and attribute weights
	const bestAttributes = Object.entries(attributes)
		.filter(([, value]) => value > 800)
		.map(([key]) => key);

	return bestAttributes.length > 0 ? bestAttributes : ['general'];
}

function calculateAverageConcentration(planetDistribution: Record<string, number>): number {
	const values = Object.values(planetDistribution);
	return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
}
