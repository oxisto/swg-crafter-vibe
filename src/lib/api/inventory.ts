/**
 * Inventory-specific API utilities and data transformation functions.
 * Handles the complex logic for enriching inventory data with schematic information.
 */

import { getSchematicById } from '$lib/data';
import { SCHEMATIC_ID_MAP } from '$lib/types/schematics.js';
import { getBlasterName } from '$lib/types/inventory.js';
import type {
	InventoryItem,
	InventoryItemWithTimestamp,
	Schematic,
	PartCategory,
	MarkLevel
} from '$lib/types';
import type { InventoryItemResponse, InventoryItemWithTimestampResponse } from '$lib/types/api.js';

/**
 * Enriches an inventory item with schematic information
 * @param item - Base inventory item
 * @returns Enriched inventory item with display name and schematic data
 */
export function enrichInventoryItem(item: InventoryItem): InventoryItemResponse {
	const key = `${item.category}-${item.markLevel}`;
	const schematicId = SCHEMATIC_ID_MAP[key];

	let schematic: Schematic | null = null;
	let displayName = `Mark ${item.markLevel} ${item.category}`;

	if (schematicId) {
		schematic = getSchematicById(schematicId);
		if (schematic) {
			displayName = schematic.name;
			// For blasters, use custom naming
			if (item.category.startsWith('Blaster')) {
				const color = item.category.includes('Green') ? 'Green' : 'Red';
				displayName = getBlasterName(item.markLevel, color as 'Green' | 'Red');
			}
		}
	}

	return {
		...item,
		displayName,
		schematic: schematic || undefined,
		schematicId: schematicId || undefined
	};
}

/**
 * Enriches an inventory item with timestamp with schematic information
 * @param item - Base inventory item with timestamp
 * @returns Enriched inventory item with display name and schematic data
 */
export function enrichInventoryItemWithTimestamp(
	item: InventoryItemWithTimestamp
): InventoryItemWithTimestampResponse {
	const enriched = enrichInventoryItem(item);
	return {
		...enriched,
		updatedAt: item.updatedAt
	};
}

/**
 * Enriches multiple inventory items with schematic information
 * @param items - Array of inventory items
 * @returns Array of enriched inventory items
 */
export function enrichInventoryItems(items: InventoryItem[]): InventoryItemResponse[] {
	return items.map(enrichInventoryItem);
}

/**
 * Enriches multiple inventory items with timestamps
 * @param items - Array of inventory items with timestamps
 * @returns Array of enriched inventory items
 */
export function enrichInventoryItemsWithTimestamps(
	items: InventoryItemWithTimestamp[]
): InventoryItemWithTimestampResponse[] {
	return items.map(enrichInventoryItemWithTimestamp);
}

/**
 * Converts inventory object format to array format with enrichment
 * @param inventory - Inventory in object format (key-value pairs)
 * @param includeSchematic - Whether to include schematic data
 * @returns Array of inventory items, optionally enriched
 */
export function convertInventoryToArray(
	inventory: Record<string, number>,
	includeSchematic = false
): InventoryItem[] | InventoryItemResponse[] {
	const items = Object.entries(inventory).map(([key, quantity]) => {
		const [category, markLevel] = key.split('-') as [PartCategory, MarkLevel];
		return {
			category,
			markLevel,
			quantity
		};
	});

	return includeSchematic ? enrichInventoryItems(items) : items;
}

/**
 * Converts array format back to object format for frontend compatibility
 * @param items - Array of inventory items
 * @returns Inventory in object format and separated metadata
 */
export function convertInventoryToObject(items: InventoryItemResponse[]) {
	const inventory: Record<string, number> = {};
	const schematicNames: Record<string, string> = {};
	const schematicIds: Record<string, string> = {};

	items.forEach((item) => {
		const key = `${item.category}-${item.markLevel}`;
		inventory[key] = item.quantity;

		if (item.displayName) {
			schematicNames[key] = item.displayName;
		}

		if (item.schematicId) {
			schematicIds[key] = item.schematicId;
		}
	});

	return {
		inventory,
		schematicNames,
		schematicIds
	};
}

/**
 * Filters inventory items by various criteria
 * @param items - Array of inventory items
 * @param filters - Filter criteria
 * @returns Filtered inventory items
 */
export function filterInventoryItems<T extends InventoryItem>(
	items: T[],
	filters: {
		category?: PartCategory;
		markLevel?: MarkLevel;
		minQuantity?: number;
		maxQuantity?: number;
		hasStock?: boolean;
	}
): T[] {
	return items.filter((item) => {
		if (filters.category && item.category !== filters.category) {
			return false;
		}

		if (filters.markLevel && item.markLevel !== filters.markLevel) {
			return false;
		}

		if (filters.minQuantity !== undefined && item.quantity < filters.minQuantity) {
			return false;
		}

		if (filters.maxQuantity !== undefined && item.quantity > filters.maxQuantity) {
			return false;
		}

		if (filters.hasStock === true && item.quantity === 0) {
			return false;
		}

		if (filters.hasStock === false && item.quantity > 0) {
			return false;
		}

		return true;
	});
}

/**
 * Sorts inventory items by various criteria
 * @param items - Array of inventory items
 * @param sortBy - Sort criteria
 * @param order - Sort order
 * @returns Sorted inventory items
 */
export function sortInventoryItems<T extends InventoryItem>(
	items: T[],
	sortBy: 'category' | 'markLevel' | 'quantity' | 'updatedAt' = 'category',
	order: 'asc' | 'desc' = 'asc'
): T[] {
	const sorted = [...items].sort((a, b) => {
		let comparison = 0;

		switch (sortBy) {
			case 'category':
				comparison = a.category.localeCompare(b.category);
				break;
			case 'markLevel':
				// Convert roman numerals to numbers for proper sorting
				const markLevelOrder = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
				comparison = markLevelOrder[a.markLevel] - markLevelOrder[b.markLevel];
				break;
			case 'quantity':
				comparison = a.quantity - b.quantity;
				break;
			case 'updatedAt':
				if ('updatedAt' in a && 'updatedAt' in b) {
					const aTime = new Date(a.updatedAt as string).getTime();
					const bTime = new Date(b.updatedAt as string).getTime();
					comparison = aTime - bTime;
				}
				break;
		}

		return order === 'desc' ? -comparison : comparison;
	});

	return sorted;
}

/**
 * Gets inventory statistics
 * @param items - Array of inventory items
 * @returns Inventory statistics
 */
export function getInventoryStats(items: InventoryItem[]) {
	const totalItems = items.length;
	const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
	const itemsInStock = items.filter((item) => item.quantity > 0).length;
	const itemsOutOfStock = items.filter((item) => item.quantity === 0).length;

	const quantityByCategory = items.reduce(
		(acc, item) => {
			acc[item.category] = (acc[item.category] || 0) + item.quantity;
			return acc;
		},
		{} as Record<PartCategory, number>
	);

	const quantityByMarkLevel = items.reduce(
		(acc, item) => {
			acc[item.markLevel] = (acc[item.markLevel] || 0) + item.quantity;
			return acc;
		},
		{} as Record<MarkLevel, number>
	);

	return {
		totalItems,
		totalQuantity,
		itemsInStock,
		itemsOutOfStock,
		stockPercentage: totalItems ? (itemsInStock / totalItems) * 100 : 0,
		quantityByCategory,
		quantityByMarkLevel
	};
}
