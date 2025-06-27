/**
 * Inventory Data Module
 *
 * Handles all inventory-related database operations including CRUD operations,
 * stock level management, and recent activity tracking.
 */

import {
	PART_CATEGORIES,
	MARK_LEVELS,
	getInventoryKey,
	type Inventory,
	type MarkLevel,
	type PartCategory
} from '../types.js';
import { getDatabase } from './database.js';
import { getSchematicById } from './schematics.js';
import { SCHEMATIC_ID_MAP, getBlasterName } from '../types.js';
import type { InventoryItemResponse, InventoryItemWithTimestampResponse } from '../types/api.js';

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

/**
 * Enriches inventory items with schematic data for enhanced display
 */
function enrichInventoryItem(item: {
	category: string;
	markLevel: string;
	quantity: number;
	updatedAt?: string;
}): InventoryItemResponse | InventoryItemWithTimestampResponse {
	const key = `${item.category}-${item.markLevel}`;
	const schematicId = SCHEMATIC_ID_MAP[key];

	let schematic = null;
	let displayName = `Mark ${item.markLevel} ${item.category}`;

	if (schematicId) {
		schematic = getSchematicById(schematicId);
		if (schematic) {
			displayName = schematic.name;
			// For blasters, use custom naming
			if (item.category.startsWith('Blaster')) {
				const color = item.category.includes('Green') ? 'Green' : 'Red';
				displayName = getBlasterName(item.markLevel as MarkLevel, color as 'Green' | 'Red');
			}
		}
	}

	const baseItem = {
		category: item.category as PartCategory,
		markLevel: item.markLevel as MarkLevel,
		quantity: item.quantity,
		displayName,
		schematic,
		schematicId
	};

	if (item.updatedAt) {
		return {
			...baseItem,
			updatedAt: item.updatedAt
		};
	}

	return baseItem;
}

/**
 * Retrieves all inventory items with optional schematic enrichment
 */
export function getAllInventoryItems(includeSchematic: boolean = false): InventoryItemResponse[] {
	const db = getDatabase();
	const rows = db.prepare('SELECT category, mark_level, quantity FROM inventory').all() as Array<{
		category: string;
		mark_level: string;
		quantity: number;
	}>;

	const items = rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity
	}));

	if (includeSchematic) {
		return items.map(enrichInventoryItem) as InventoryItemResponse[];
	}

	return items.map((item) => ({
		category: item.category as PartCategory,
		markLevel: item.markLevel as MarkLevel,
		quantity: item.quantity
	}));
}

/**
 * Retrieves all inventory items with timestamps and optional schematic enrichment
 */
export function getAllInventoryItemsWithTimestamps(
	includeSchematic: boolean = false
): InventoryItemWithTimestampResponse[] {
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

	const items = rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));

	if (includeSchematic) {
		return items.map(enrichInventoryItem) as InventoryItemWithTimestampResponse[];
	}

	return items.map((item) => ({
		category: item.category as PartCategory,
		markLevel: item.markLevel as MarkLevel,
		quantity: item.quantity,
		updatedAt: item.updatedAt
	}));
}

/**
 * Gets recently updated inventory items with optional schematic enrichment
 */
export function getRecentInventoryItems(
	limit: number = 10,
	includeSchematic: boolean = false
): InventoryItemWithTimestampResponse[] {
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

	const items = rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));

	if (includeSchematic) {
		return items.map(enrichInventoryItem) as InventoryItemWithTimestampResponse[];
	}

	return items.map((item) => ({
		category: item.category as PartCategory,
		markLevel: item.markLevel as MarkLevel,
		quantity: item.quantity,
		updatedAt: item.updatedAt
	}));
}

/**
 * Gets a single inventory item with optional schematic enrichment
 */
export function getInventoryItemWithSchematic(
	category: PartCategory,
	markLevel: MarkLevel,
	includeSchematic: boolean = false
): InventoryItemResponse | null {
	const quantity = getInventoryItem(category, markLevel);

	const baseItem = {
		category,
		markLevel,
		quantity
	};

	if (includeSchematic) {
		return enrichInventoryItem(baseItem) as InventoryItemResponse;
	}

	return baseItem;
}

/**
 * Gets a single inventory item with timestamp and optional schematic enrichment
 */
export function getInventoryItemWithTimestampAndSchematic(
	category: PartCategory,
	markLevel: MarkLevel,
	includeSchematic: boolean = false
): InventoryItemWithTimestampResponse | null {
	const item = getInventoryItemWithTimestamp(category, markLevel);

	if (!item) return null;

	const baseItem = {
		category,
		markLevel,
		quantity: item.quantity,
		updatedAt: item.updatedAt
	};

	if (includeSchematic) {
		return enrichInventoryItem(baseItem) as InventoryItemWithTimestampResponse;
	}

	return baseItem;
}
