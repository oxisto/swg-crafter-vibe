/**
 * Server-only initialization functions
 * This file contains Node.js-specific imports and should never be imported by frontend code
 */

import { initDatabase, dbLogger } from './database.js';
import { initializeInventoryDefaults } from './inventory.js';
import { initializeSettingsDefaults } from './settings.js';
import { initializeLoadoutDefaults } from './loadouts.js';
import { downloadAndCacheSchematics } from './schematics.js';
import { downloadAndCacheResources } from './resources.js';
import { shouldUpdateResourceTree, importResourceTree } from './resource-tree-importer.js';

/**
 * Initializes the complete data layer with all default values and background downloads
 * This is the main server-side initialization function
 * Should only be called from server-side code (hooks.server.ts, etc.)
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
		),
		// Import resource tree if needed
		(async () => {
			try {
				if (shouldUpdateResourceTree()) {
					dbLogger.info('Resource tree update needed, importing...');
					await importResourceTree();
					dbLogger.info('Resource tree import completed');
				}
			} catch (error) {
				dbLogger.error('Failed to import resource tree', { error: String(error) });
			}
		})()
	]);

	return db;
}

// Re-export server-only resource tree functions for API routes
export {
	shouldUpdateResourceTree,
	importResourceTree,
	getResourceClassFromDB,
	getResourceClassChildren,
	getResourceClassPath,
	searchResourceClasses as searchResourceClassesDB,
	getResourceTreeStats,
	type ResourceClassDBRecord
} from './resource-tree-importer.js';
