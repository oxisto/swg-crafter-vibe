/**
 * Loadouts Database Schema
 *
 * Handles the creation and management of loadouts-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create ship loadouts table
 */
export function createLoadoutsTable() {
	const db = getDatabase();
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
