/**
 * Resources Database Schema
 *
 * Handles the creation and management of resources-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create resources tables
 */
export function createResourcesTable() {
	const db = getDatabase();

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
 * Create resource classes table for storing the comprehensive resource tree
 */
export function createResourceClassesTable() {
	const db = getDatabase();

	db.exec(`
    CREATE TABLE IF NOT EXISTS resource_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swgcraft_id TEXT NOT NULL UNIQUE,
      swgID INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      parent_id TEXT,
      depth INTEGER NOT NULL DEFAULT 0,
      
      -- Resource stat ranges
      oq_min INTEGER,
      oq_max INTEGER,
      pe_min INTEGER,
      pe_max INTEGER,
      dr_min INTEGER,
      dr_max INTEGER,
      fl_min INTEGER,
      fl_max INTEGER,
      hr_min INTEGER,
      hr_max INTEGER,
      ma_min INTEGER,
      ma_max INTEGER,
      cd_min INTEGER,
      cd_max INTEGER,
      cr_min INTEGER,
      cr_max INTEGER,
      sh_min INTEGER,
      sh_max INTEGER,
      ut_min INTEGER,
      ut_max INTEGER,
      sr_min INTEGER,
      sr_max INTEGER,
      
      -- Flags
      recycled BOOLEAN DEFAULT FALSE,
      harvested BOOLEAN DEFAULT TRUE,
      
      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (parent_id) REFERENCES resource_classes (swgcraft_id)
    )
  `);

	// Create indexes for better query performance
	db.exec(
		`CREATE INDEX IF NOT EXISTS idx_resource_classes_swgcraft_id ON resource_classes(swgcraft_id)`
	);
	db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_classes_swgid ON resource_classes(swgID)`);
	db.exec(
		`CREATE INDEX IF NOT EXISTS idx_resource_classes_parent_id ON resource_classes(parent_id)`
	);
	db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_classes_name ON resource_classes(name)`);

	// Create a metadata table to track when we last imported the resource tree
	db.exec(`
    CREATE TABLE IF NOT EXISTS resource_tree_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create resource inventory table for tracking owned resources
 */
export function createResourceInventoryTable() {
	const db = getDatabase();

	// Create the table if it doesn't exist (but don't drop existing data!)
	db.exec(`
		CREATE TABLE IF NOT EXISTS resource_inventory (
			resource_id INTEGER PRIMARY KEY,
			amount TEXT NOT NULL CHECK (amount IN ('none', 'very_low', 'low', 'medium', 'high', 'very_high')),
			notes TEXT,
			last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (resource_id) REFERENCES resources (id)
		)
	`);

	// Create indexes for better query performance
	db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_inventory_amount ON resource_inventory(amount)`);
}
