/**
 * Schematic Data Processing Utilities
 *
 * Utility functions for processing and transforming schematic data
 * from raw XML format to structured database format.
 */

import type {
	Schematic,
	SchematicComponent,
	SchematicResource,
	ExperimentationProperty,
	ExperimentationGroup
} from '$lib/types/schematics.js';

/**
 * Converts experimentation weight values to proper fractions
 * @param value - Raw weight value from XML (string or number)
 * @returns Proper fractional weight as percentage
 */
function convertExperimentationWeight(value: any): number {
	const intValue = parseInt(value) || 0;

	// Convert common fractions to their precise decimal equivalents
	if (intValue === 33) {
		return 100 / 3; // 33.333333...%
	} else if (intValue === 66) {
		return 200 / 3; // 66.666666...%
	} else if (intValue === 67) {
		return 200 / 3; // Sometimes 67 is used instead of 66.67, treat as 2/3
	}

	// For other values, return as-is
	return intValue;
}

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
 * Parses experimentation properties from raw XML experimentation data
 * @param expData - Raw experimentation data from XML
 * @returns Array of processed experimentation properties
 */
export function parseExperimentationProperties(expData: any): ExperimentationProperty[] {
	const properties: ExperimentationProperty[] = [];

	if (!expData) {
		return properties;
	}

	const expArray = Array.isArray(expData) ? expData : [expData];

	for (const exp of expArray) {
		if (exp._desc) {
			const property: ExperimentationProperty = {
				desc: exp._desc
			};

			// Add percentage values if they exist, converting to proper fractions
			if (exp._cd) property.cd = convertExperimentationWeight(exp._cd);
			if (exp._oq) property.oq = convertExperimentationWeight(exp._oq);
			if (exp._ut) property.ut = convertExperimentationWeight(exp._ut);
			if (exp._sr) property.sr = convertExperimentationWeight(exp._sr);
			if (exp._pe) property.pe = convertExperimentationWeight(exp._pe);
			if (exp._hr) property.hr = convertExperimentationWeight(exp._hr);
			if (exp._ma) property.ma = convertExperimentationWeight(exp._ma);
			if (exp._cr) property.cr = convertExperimentationWeight(exp._cr);
			if (exp._dr) property.dr = convertExperimentationWeight(exp._dr);
			if (exp._fl) property.fl = convertExperimentationWeight(exp._fl);
			if (exp._er) property.er = convertExperimentationWeight(exp._er);

			properties.push(property);
		}
	}

	return properties;
}

/**
 * Parses experimentation groups from raw XML experimentation group data
 * @param expGrpData - Raw experimentation group data from XML
 * @returns Array of processed experimentation groups
 */
export function parseExperimentationGroups(expGrpData: any): ExperimentationGroup[] {
	const groups: ExperimentationGroup[] = [];

	if (!expGrpData) {
		return groups;
	}

	const groupArray = Array.isArray(expGrpData) ? expGrpData : [expGrpData];

	for (const group of groupArray) {
		if (group._desc && group.exp) {
			groups.push({
				desc: group._desc,
				properties: parseExperimentationProperties(group.exp)
			});
		}
	}

	return groups;
}

/**
 * Converts raw schematic data to clean Schematic object
 * @param rawSchematic - Raw schematic data from XML with underscore-prefixed properties
 * @returns Clean Schematic object
 */
export function createCleanSchematic(rawSchematic: any): Schematic {
	const components = parseSchematicComponents(rawSchematic.component);
	const resources = parseSchematicResources(rawSchematic.resource);
	const experimentation = parseExperimentationGroups(rawSchematic.exp_grp);

	return {
		id: rawSchematic._id,
		name: rawSchematic._name,
		category: rawSchematic._category || '',
		profession: rawSchematic._profession || '',
		complexity: parseInt(rawSchematic._complexity) || 0,
		datapad: parseInt(rawSchematic._datapad) || 0,
		components,
		resources,
		experimentation: experimentation.length > 0 ? experimentation : undefined
	};
}
