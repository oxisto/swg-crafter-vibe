/**
 * Resource Inventory Data Module
 *
 * Handles resource inventory management for tracking owned resources
 * with rough quantity categories (very_low, low, medium, high).
 */

import { getDatabase, dbLogger } from './database.js';
import type { ResourceInventoryItem, ResourceInventoryAmount } from '$lib/types/resources.js';

/**
 * Get all resource inventory items
 * @returns Array of resource inventory items
 */
export function getAllResourceInventory(): ResourceInventoryItem[] {
	const db = getDatabase();

	const stmt = db.prepare(`
		SELECT 
			ri.resource_id as resourceId,
			ri.amount,
			ri.notes,
			ri.last_updated as lastUpdated,
			ri.created_at as createdAt
		FROM resource_inventory ri
		ORDER BY ri.resource_id ASC
	`);

	const rows = stmt.all() as any[];
	return rows.map((row) => ({
		resourceId: row.resourceId,
		amount: row.amount as ResourceInventoryAmount,
		notes: row.notes || undefined,
		lastUpdated: row.lastUpdated,
		createdAt: row.createdAt
	}));
}

/**
 * Get resource inventory by resource ID
 * @param resourceId - The resource ID
 * @returns Resource inventory item or null if not found
 */
export function getResourceInventoryByResourceId(resourceId: number): ResourceInventoryItem | null {
	const db = getDatabase();

	const stmt = db.prepare(`
		SELECT 
			ri.resource_id as resourceId,
			ri.amount,
			ri.notes,
			ri.last_updated as lastUpdated,
			ri.created_at as createdAt
		FROM resource_inventory ri
		WHERE ri.resource_id = ?
	`);

	const row = stmt.get(resourceId) as any;
	if (!row) return null;

	return {
		resourceId: row.resourceId,
		amount: row.amount as ResourceInventoryAmount,
		notes: row.notes || undefined,
		lastUpdated: row.lastUpdated,
		createdAt: row.createdAt
	};
}

/**
 * Set or update resource inventory
 * @param resourceId - The resource ID
 * @param amount - The inventory amount
 * @param notes - Optional notes
 * @returns The updated resource inventory item
 */
export function setResourceInventory(
	resourceId: number,
	amount: ResourceInventoryAmount,
	notes?: string
): ResourceInventoryItem {
	const db = getDatabase();
	const now = new Date().toISOString();

	// Check if inventory item already exists
	const existing = getResourceInventoryByResourceId(resourceId);

	if (existing) {
		// Update existing item
		const updateStmt = db.prepare(`
			UPDATE resource_inventory 
			SET amount = ?, notes = ?, last_updated = ?
			WHERE resource_id = ?
		`);

		updateStmt.run(amount, notes || null, now, resourceId);

		return {
			...existing,
			amount,
			notes,
			lastUpdated: now
		};
	} else {
		// Create new item
		const insertStmt = db.prepare(`
			INSERT INTO resource_inventory (
				resource_id, amount, notes, last_updated, created_at
			)
			VALUES (?, ?, ?, ?, ?)
		`);

		insertStmt.run(resourceId, amount, notes || null, now, now);

		return {
			resourceId,
			amount,
			notes,
			lastUpdated: now,
			createdAt: now
		};
	}
}

/**
 * Remove resource from inventory
 * @param resourceId - The resource ID
 * @returns True if removed, false if not found
 */
export function removeResourceInventory(resourceId: number): boolean {
	const db = getDatabase();

	const stmt = db.prepare('DELETE FROM resource_inventory WHERE resource_id = ?');
	const result = stmt.run(resourceId);

	return result.changes > 0;
}

/**
 * Get resource inventory statistics
 * @returns Statistics about the resource inventory
 */
export function getResourceInventoryStats() {
	const db = getDatabase();

	const totalStmt = db.prepare('SELECT COUNT(*) as count FROM resource_inventory');
	const total = (totalStmt.get() as any).count;

	const byAmountStmt = db.prepare(`
		SELECT amount, COUNT(*) as count 
		FROM resource_inventory 
		GROUP BY amount
	`);
	const byAmount = byAmountStmt.all() as any[];

	const distributionStmt = db.prepare(`
		SELECT amount, COUNT(*) as count 
		FROM resource_inventory 
		WHERE amount != 'none'
		GROUP BY amount
	`);
	const distribution = distributionStmt.all() as any[];

	return {
		total,
		byAmount: byAmount.reduce(
			(acc, row) => {
				acc[row.amount] = row.count;
				return acc;
			},
			{} as Record<ResourceInventoryAmount, number>
		),
		distribution: distribution.reduce(
			(acc, row) => {
				acc[row.amount] = row.count;
				return acc;
			},
			{} as Record<ResourceInventoryAmount, number>
		)
	};
}
