/**
 * Schematic Data Processing Utilities
 *
 * Utility functions for processing and transforming schematic data
 * from raw XML format to structured database format.
 */

import type { Schematic, SchematicComponent, SchematicResource } from '$lib/types/schematics.js';

/**
 * Parses schematic components from raw XML component data
 * @param componentData - Raw component data from XML
 * @returns Array of processed schematic components
 */
export function parseSchematicComponents(componentData: any): SchematicComponent[] {
	const components: SchematicComponent[] = [];

	if (!componentData) {
		return components;
	}

	const componentArray = Array.isArray(componentData) ? componentData : [componentData];

	for (const component of componentArray) {
		if (component._desc && component._number) {
			components.push({
				name: component._desc,
				amount: parseInt(component._number) || 1,
				units: component._type === 'schematic' ? 'units' : 'units'
			});
		}
	}

	return components;
}

/**
 * Parses schematic resources from raw XML resource data
 * @param resourceData - Raw resource data from XML
 * @returns Array of processed schematic resources
 */
export function parseSchematicResources(resourceData: any): SchematicResource[] {
	const resources: SchematicResource[] = [];

	if (!resourceData) {
		return resources;
	}

	const resourceArray = Array.isArray(resourceData) ? resourceData : [resourceData];

	for (const resource of resourceArray) {
		if (resource._desc && resource._units) {
			resources.push({
				name: resource._desc,
				amount: parseInt(resource._units) || 0,
				units: 'units',
				classes: resource._id ? [resource._id] : []
			});
		}
	}

	return resources;
}

/**
 * Converts raw schematic data to clean Schematic object
 * @param rawSchematic - Raw schematic data from XML with underscore-prefixed properties
 * @returns Clean Schematic object
 */
export function createCleanSchematic(rawSchematic: any): Schematic {
	const components = parseSchematicComponents(rawSchematic.component);
	const resources = parseSchematicResources(rawSchematic.resource);

	return {
		id: rawSchematic._id,
		name: rawSchematic._name,
		category: rawSchematic._category || '',
		profession: rawSchematic._profession || '',
		complexity: parseInt(rawSchematic._complexity) || 0,
		datapad: parseInt(rawSchematic._datapad) || 0,
		components,
		resources
	};
}
