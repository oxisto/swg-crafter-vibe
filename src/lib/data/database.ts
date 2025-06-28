/**
 * Database Module
 *
 * Main entry point for database functionality. This module provides
 * backward compatibility by re-exporting from the modular database structure.
 */

// Re-export all functions from the modular database structure
export {
	getDatabase,
	closeDatabase,
	initDatabase,
	dbLogger,
	createInventoryTable,
	createSettingsTable,
	createSchematicsTable,
	createFavoritesTable,
	createResourcesTable,
	createResourceClassesTable,
	createMailsTables,
	createSalesTable,
	createLoadoutsTable
} from './database/index.js';
