/**
 * Database Connection Module
 *
 * Provides the core database connection functionality.
 * This module handles database initialization and connection management.
 */

import Database from 'better-sqlite3';
import { createLogger } from '../../logger.js';

const DB_PATH = 'database.sqlite3';
export const dbLogger = createLogger({ component: 'database' });

let db: Database.Database;

/**
 * Gets the database instance, initializing it if not already done.
 * @returns The SQLite database instance
 */
export function getDatabase() {
	if (!db) {
		db = new Database(DB_PATH);
	}
	return db;
}

/**
 * Closes the database connection gracefully.
 * Should be called when the application is shutting down.
 */
export function closeDatabase() {
	if (db) {
		db.close();
	}
}
