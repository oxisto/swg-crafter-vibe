/**
 * Core Database Module
 *
 * Provides the core database connection and initialization functionality.
 * This module handles database setup, table creation, and basic utilities.
 */

import Database from 'better-sqlite3';
import { createLogger } from '../logger.js';

const DB_PATH = 'database.sqlite3';
let dbLogger = createLogger({ component: 'database' });

let db: Database.Database;

/**
 * Initializes the SQLite database and creates necessary tables.
 * Sets up all required tables with proper schemas.
 */
export function initDatabase() {
	// Re-initialize the logger now that server logger is available
	dbLogger = createLogger({ component: 'database' });

	db = new Database(DB_PATH);

	// Create all tables
	createInventoryTable();
	createSettingsTable();
	createSchematicsTable();
	createResourcesTable();
	createMailsTables();
	createSalesTable();
	createLoadoutsTable();

	return db;
}

/**
 * Gets the database instance, initializing it if not already done.
 * @returns The SQLite database instance
 */
export function getDatabase() {
	if (!db) {
		initDatabase();
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

/**
 * Create inventory table
 */
function createInventoryTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      mark_level TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, mark_level)
    )
  `);
}

/**
 * Create settings table
 */
function createSettingsTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create schematics tables
 */
function createSchematicsTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS schematics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      profession TEXT,
      complexity INTEGER,
      datapad INTEGER,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	db.exec(`
    CREATE TABLE IF NOT EXISTS schematics_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create resources tables
 */
function createResourcesTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      class_name TEXT NOT NULL,
      class_path TEXT,
      attributes TEXT NOT NULL,
      planet_distribution TEXT NOT NULL,
      enter_date TEXT NOT NULL,
      despawn_date TEXT,
      is_currently_spawned BOOLEAN NOT NULL DEFAULT 1,
      stats TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Add new columns to existing resources table if they don't exist
	try {
		db.exec(`ALTER TABLE resources ADD COLUMN despawn_date TEXT`);
	} catch (e) {
		// Column already exists - ignore
	}

	try {
		db.exec(`ALTER TABLE resources ADD COLUMN is_currently_spawned BOOLEAN NOT NULL DEFAULT 1`);
	} catch (e) {
		// Column already exists - ignore
	}

	try {
		db.exec(`ALTER TABLE resources ADD COLUMN soap_last_updated DATETIME`);
	} catch (e) {
		// Column already exists - ignore
	}

	db.exec(`
    CREATE TABLE IF NOT EXISTS resources_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create mails tables
 */
function createMailsTables() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS mails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail_id TEXT UNIQUE NOT NULL,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      body TEXT NOT NULL,
      location TEXT,
      import_batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	db.exec(`
    CREATE TABLE IF NOT EXISTS mail_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      total_mails INTEGER NOT NULL,
      imported_mails INTEGER NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create sales table
 */
function createSalesTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail_id TEXT UNIQUE NOT NULL,
      timestamp DATETIME NOT NULL,
      item_name TEXT NOT NULL,
      buyer TEXT NOT NULL,
      credits INTEGER NOT NULL,
      location TEXT,
      category TEXT,
      mark_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create ship loadouts table
 */
function createLoadoutsTable() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS ship_loadouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ship_type TEXT NOT NULL,
      variant TEXT,
      mark_level TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      schematic_id TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export { dbLogger };
