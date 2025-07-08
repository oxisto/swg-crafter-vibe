/**
 * Data Layer Index
 *
 * Main entry point for the data layer. Exports all data access functions
 * and handles initialization of the database and default data.
 */

// Database core
export { initDatabase, getDatabase, closeDatabase } from './database.js';

// Inventory
export {
	getAllInventory,
	updateInventoryItem,
	getInventoryItem,
	getInventoryItemWithTimestamp,
	getAllInventoryWithTimestamps,
	getRecentlyUpdatedInventory,
	getAllInventoryItems,
	getAllInventoryItemsWithTimestamps,
	getRecentInventoryItems,
	getInventoryItemWithSchematic,
	getInventoryItemWithTimestampAndSchematic
} from './inventory.js';

// Settings
export {
	getSetting,
	setSetting,
	getRecommendedStockLevel,
	setRecommendedStockLevel,
	getSellValues,
	setSellValue,
	setSellValues
} from './settings.js';

// Cache
export {
	checkCacheStatus,
	updateCacheTimestamp,
	deleteCacheEntry,
	getAllCacheEntries,
	CACHE_CONFIG
} from './cache.js';

// Schematics
export {
	getAllSchematics,
	getSchematicsByCategory,
	getSchematicById,
	toggleSchematicFavorite,
	markSchematicsWithLoadoutsAsFavorites,
	downloadAndCacheSchematics
} from './schematics.js';

// Resources
export {
	getAllResources,
	getResourcesByClass,
	searchResources,
	getResourceById,
	downloadAndCacheResources
} from './resources.js';

// Resource Classes (Database-driven, frontend-safe)
export {
	getResourceDisplayName,
	formatResourceClasses,
	getResourceClassName,
	getResourceClassCategory,
	type ResourceClassInfo
} from './resource-functions.js';

// Resource Inventory
export {
	getAllResourceInventory,
	getResourceInventoryByResourceId,
	setResourceInventory,
	removeResourceInventory,
	getResourceInventoryStats
} from './resource-inventory.js';

// SOAP API integration
export {
	getResourceInfoByName,
	getResourceInfoById,
	updateResourceSOAPData,
	type SOAPResourceInfo
} from './soap.js';

// Mails
export { importMailBatch, getMails, getMailsCount, getMailImports } from './mails.js';

// Sales
export { extractSalesFromMails, getSales, getSalesAnalytics } from './sales.js';

// Loadouts
export {
	getAllLoadouts,
	updateLoadoutQuantity,
	updateLoadoutPrice,
	getLoadoutById,
	createLoadout,
	deleteLoadout,
	getLoadoutsByShipType
} from './loadouts.js';

// Schematic Resource Loadouts
export {
	getSchematicLoadouts,
	getSchematicLoadoutResources,
	createSchematicLoadout,
	assignResourceToLoadout,
	deleteSchematicLoadout,
	renameSchematicLoadout,
	updateSchematicLoadoutExperimentationProperty,
	type SchematicResourceLoadout,
	type SchematicLoadoutSummary
} from './schematic-resource-loadouts.js';

// Chassis
export { getAllChassis, getChassisById, updateChassisQuantity } from './chassis.js';

// Server initialization
export { initializeDataLayer } from './server-init.js';
