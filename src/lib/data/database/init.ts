/**
 * Database Initialization Module
 *
 * Provides the main database initialization functionality by coordinating
 * all table creation modules.
 */

import { getDatabase, dbLogger } from './connection.js';
import { createInventoryTable } from './inventory.js';
import { createSettingsTable } from './settings.js';
import { createSchematicsTable, createFavoritesTable } from './schematics.js';
import { createResourcesTable, createResourceClassesTable } from './resources.js';
import { createMailsTables } from './mails.js';
import { createSalesTable } from './sales.js';
import { createLoadoutsTable } from './loadouts.js';

/**
 * Initializes the SQLite database and creates necessary tables.
 * Sets up all required tables with proper schemas.
 */
export function initDatabase() {
	// Re-initialize the logger now that server logger is available
	const logger = dbLogger;

	const db = getDatabase();

	// Create all tables
	createInventoryTable();
	createSettingsTable();
	createSchematicsTable();
	createFavoritesTable();
	createResourcesTable();
	createMailsTables();
	createSalesTable();
	createLoadoutsTable();
	// Add resource classes table for the comprehensive resource tree data
	createResourceClassesTable();

	logger.info('Database initialized with all tables');
	return db;
}
