/**
 * Settings Database Schema
 *
 * Handles the creation and management of settings-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create settings table
 */
export function createSettingsTable() {
	const db = getDatabase();
	db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
