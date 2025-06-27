/**
 * Main entry point for all type definitions in the Star Wars Galaxies shipwright system.
 * Re-exports all types from domain-specific modules for easy importing.
 */

// Re-export inventory types
export type {
	MarkLevel,
	PartCategory,
	InventoryItem,
	InventoryItemWithTimestamp,
	Inventory,
	Settings
} from './inventory.js';

export {
	MARK_LEVELS,
	PART_CATEGORIES,
	getInventoryKey,
	getBlasterName,
	calculateInventoryValue,
	calculateMarkLevelValue
} from './inventory.js';

// Re-export schematic types
export type { Schematic, SchematicComponent, SchematicResource } from './schematics.js';

export { SCHEMATIC_CATEGORY_MAP, SCHEMATIC_ID_MAP } from './schematics.js';

// Re-export resource types
export type {
	Resource,
	ResourceAttributes,
	ResourceStats,
	Planet,
	PlanetInfo
} from './resources.js';

export { PLANETS, PLANET_DATA, getPlanetInfo } from './resources.js';

// Re-export ship types
export type { ShipLoadout, Chassis, ShipChassis, ShipType } from './ships.js';

export { SHIP_CHASSIS, SHIP_LOADOUTS, calculateLoadoutsValue, getLoadoutKey } from './ships.js';

// Re-export sales types
export type { MailData, Sale, MailImport, MailBatch, MailStats, SalesAnalytics } from './sales.js';

// Legacy compatibility - re-export everything as it was before
// This ensures existing imports continue to work
export * from './inventory.js';
export * from './schematics.js';
export * from './resources.js';
export * from './ships.js';
export * from './sales.js';
