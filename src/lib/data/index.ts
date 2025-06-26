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
	getRecentlyUpdatedInventory
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
	downloadAndCacheSchematics,
	getAllSchematics,
	getSchematicsByCategory,
	getSchematicById,
	toggleSchematicFavorite
} from './schematics.js';

// Resources
export {
	downloadAndCacheResources,
	getAllResources,
	getResourcesByClass,
	searchResources,
	getResourceById
} from './resources.js';

// SOAP
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

// Initialization
import { initializeInventoryDefaults } from './inventory.js';
import { initializeSettingsDefaults } from './settings.js';
import { initializeLoadoutDefaults } from './loadouts.js';
import { downloadAndCacheSchematics } from './schematics.js';
import { downloadAndCacheResources } from './resources.js';
import { initDatabase } from './database.js';
import { dbLogger } from './database.js';

/**
 * Initializes the complete data layer with all default values and background downloads
 * This is the main initialization function that replaces the old initDatabase
 */
export function initializeDataLayer() {
	// Initialize core database
	const db = initDatabase();

	// Initialize default data
	initializeInventoryDefaults();
	initializeSettingsDefaults();
	initializeLoadoutDefaults();

	// Download and cache external data in the background
	Promise.all([
		downloadAndCacheSchematics().catch((error) =>
			dbLogger.error('Failed to download schematics', { error })
		),
		downloadAndCacheResources().catch((error) =>
			dbLogger.error('Failed to download resources', { error })
		)
	]);

	return db;
}
