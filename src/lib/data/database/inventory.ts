/**
 * Inventory Database Schema
 *
 * Handles the creation and management of inventory-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create inventory table
 */
export function createInventoryTable() {
	const db = getDatabase();
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
