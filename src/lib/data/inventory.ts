/**
 * Inventory Data Module
 *
 * Handles all inventory-related database operations including CRUD operations,
 * stock level management, and recent activity tracking.
 */

import { PART_CATEGORIES, MARK_LEVELS, getInventoryKey, type Inventory } from '../types.js';
import { getDatabase } from './database.js';

/**
 * Initializes inventory with default values if empty
 */
export function initializeInventoryDefaults() {
	const db = getDatabase();
	const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };

	if (count.count === 0) {
		const insert = db.prepare(`
      INSERT INTO inventory (category, mark_level, quantity) 
      VALUES (?, ?, 0)
    `);

		const insertMany = db.transaction(() => {
			for (const category of PART_CATEGORIES) {
				for (const markLevel of MARK_LEVELS) {
					insert.run(category, markLevel);
				}
			}
		});

		insertMany();
	}
}

/**
 * Retrieves all inventory items from the database.
 * @returns An inventory object with keys in format "{category}-{markLevel}" and quantity values
 */
export function getAllInventory(): Inventory {
	const db = getDatabase();
	const rows = db.prepare('SELECT category, mark_level, quantity FROM inventory').all() as Array<{
		category: string;
		mark_level: string;
		quantity: number;
	}>;

	const inventory: Inventory = {};

	for (const row of rows) {
		const key = getInventoryKey(row.category as any, row.mark_level as any);
		inventory[key] = row.quantity;
	}

	return inventory;
}

/**
 * Updates the quantity of a specific inventory item.
 * @param category - The part category (e.g., "Armor", "Engine")
 * @param markLevel - The mark level (e.g., "I", "II", "III", "IV", "V")
 * @param quantity - The new quantity value
 */
export function updateInventoryItem(category: string, markLevel: string, quantity: number): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    UPDATE inventory 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE category = ? AND mark_level = ?
  `);

	stmt.run(quantity, category, markLevel);
}

/**
 * Retrieves the quantity of a specific inventory item.
 * @param category - The part category
 * @param markLevel - The mark level
 * @returns The quantity of the item, or 0 if not found
 */
export function getInventoryItem(category: string, markLevel: string): number {
	const db = getDatabase();
	const stmt = db.prepare('SELECT quantity FROM inventory WHERE category = ? AND mark_level = ?');
	const result = stmt.get(category, markLevel) as { quantity: number } | undefined;

	return result?.quantity ?? 0;
}

/**
 * Retrieves a specific inventory item with its update timestamp.
 * @param category - The part category
 * @param markLevel - The mark level
 * @returns The inventory item with quantity and update timestamp, or null if not found
 */
export function getInventoryItemWithTimestamp(
	category: string,
	markLevel: string
): {
	quantity: number;
	updatedAt: string;
} | null {
	const db = getDatabase();
	const stmt = db.prepare(
		'SELECT quantity, updated_at FROM inventory WHERE category = ? AND mark_level = ?'
	);
	const result = stmt.get(category, markLevel) as
		| { quantity: number; updated_at: string }
		| undefined;

	if (!result) return null;

	return {
		quantity: result.quantity,
		updatedAt: result.updated_at
	};
}

/**
 * Retrieves all inventory items with their update timestamps.
 * @returns An array of inventory items with quantities and update timestamps
 */
export function getAllInventoryWithTimestamps(): Array<{
	category: string;
	markLevel: string;
	quantity: number;
	updatedAt: string;
}> {
	const db = getDatabase();
	const rows = db
		.prepare(
			'SELECT category, mark_level, quantity, updated_at FROM inventory ORDER BY updated_at DESC'
		)
		.all() as Array<{
		category: string;
		mark_level: string;
		quantity: number;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));
}

/**
 * Gets the most recently updated inventory items.
 * @param limit - Maximum number of items to return (default: 10)
 * @returns An array of recently updated inventory items
 */
export function getRecentlyUpdatedInventory(limit: number = 10): Array<{
	category: string;
	markLevel: string;
	quantity: number;
	updatedAt: string;
}> {
	const db = getDatabase();
	const stmt = db.prepare(`
		SELECT category, mark_level, quantity, updated_at 
		FROM inventory 
		WHERE updated_at > datetime('now', '-7 days')
		ORDER BY updated_at DESC 
		LIMIT ?
	`);

	const rows = stmt.all(limit) as Array<{
		category: string;
		mark_level: string;
		quantity: number;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));
}
