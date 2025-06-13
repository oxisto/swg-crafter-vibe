/**
 * Settings Data Module
 *
 * Handles all settings-related database operations including
 * recommended stock levels and sell values.
 */

import { MARK_LEVELS } from '../types.js';
import { getDatabase } from './database.js';

/**
 * Initializes default settings if they don't exist
 */
export function initializeSettingsDefaults() {
	const db = getDatabase();
	const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as {
		count: number;
	};

	if (settingsCount.count === 0) {
		const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
		insertSetting.run('recommendedStockLevel', '10');

		// Initialize default sell values for each mark level
		for (const markLevel of MARK_LEVELS) {
			insertSetting.run(`sellValue_${markLevel}`, '0');
		}
	}
}

/**
 * Retrieves a setting value by key.
 * @param key - The setting key to retrieve
 * @returns The setting value, or null if not found
 */
export function getSetting(key: string): string | null {
	const db = getDatabase();
	const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
	const result = stmt.get(key) as { value: string } | undefined;

	return result?.value ?? null;
}

/**
 * Sets or updates a setting value.
 * @param key - The setting key
 * @param value - The setting value to store
 */
export function setSetting(key: string, value: string): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);

	stmt.run(key, value);
}

/**
 * Gets the recommended stock level setting.
 * @returns The recommended stock level, defaults to 10 if not set
 */
export function getRecommendedStockLevel(): number {
	const value = getSetting('recommendedStockLevel');
	return value ? parseInt(value, 10) : 10;
}

/**
 * Sets the recommended stock level setting.
 * @param level - The new recommended stock level
 */
export function setRecommendedStockLevel(level: number): void {
	setSetting('recommendedStockLevel', level.toString());
}

/**
 * Gets sell values for all mark levels.
 * @returns An object mapping mark levels to their sell values
 */
export function getSellValues(): Record<string, number> {
	const sellValues: Record<string, number> = {};

	for (const markLevel of MARK_LEVELS) {
		const value = getSetting(`sellValue_${markLevel}`);
		sellValues[markLevel] = value ? parseFloat(value) : 0;
	}

	return sellValues;
}

/**
 * Sets the sell value for a specific mark level.
 * @param markLevel - The mark level to set the sell value for
 * @param value - The sell value
 */
export function setSellValue(markLevel: string, value: number): void {
	setSetting(`sellValue_${markLevel}`, value.toString());
}

/**
 * Sets sell values for all mark levels.
 * @param sellValues - An object mapping mark levels to their sell values
 */
export function setSellValues(sellValues: Record<string, number>): void {
	for (const [markLevel, value] of Object.entries(sellValues)) {
		setSellValue(markLevel, value);
	}
}
