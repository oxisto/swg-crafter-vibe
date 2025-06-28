/**
 * Sales Database Schema
 *
 * Handles the creation and management of sales-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create sales table
 */
export function createSalesTable() {
	const db = getDatabase();
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
