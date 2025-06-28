/**
 * Mails Database Schema
 *
 * Handles the creation and management of mails-related database tables.
 */

import { getDatabase } from './connection.js';

/**
 * Create mails tables
 */
export function createMailsTables() {
	const db = getDatabase();

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
