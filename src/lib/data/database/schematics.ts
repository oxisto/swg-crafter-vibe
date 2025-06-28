/**
 * Schematics Database Schema
 *
 * Handles the creation and management of schematics-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create schematics tables
 */
export function createSchematicsTable() {
	const db = getDatabase();

	db.exec(`
    CREATE TABLE IF NOT EXISTS schematics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      profession TEXT,
      complexity INTEGER,
      datapad INTEGER,
      is_favorite BOOLEAN DEFAULT FALSE,
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

	// Add is_favorite column if it doesn't exist (migration)
	try {
		db.exec(`ALTER TABLE schematics ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE`);
	} catch (error) {
		// Column already exists, ignore error
	}
}

/**
 * Create favorites table for storing user's favorite schematics
 */
export function createFavoritesTable() {
	const db = getDatabase();
	db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      schematic_id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schematic_id) REFERENCES schematics (id)
    )
  `);
}
