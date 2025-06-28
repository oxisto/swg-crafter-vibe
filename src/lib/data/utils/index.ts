/**
 * Data Processing Utilities
 *
 * Main entry point for data processing utility functions.
 * Provides utilities for parsing and transforming various data formats.
 */

// Schematic utilities
export {
	parseSchematicComponents,
	parseSchematicResources,
	createCleanSchematic
} from './schematic-parser.js';

// Resource utilities
export {
	extractResourceAttributes,
	extractPlanetDistribution,
	buildClassPath,
	validateResourceId,
	processResourceData
} from './resource-parser.js';
