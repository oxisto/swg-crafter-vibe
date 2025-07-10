/**
 * @fileoverview Svelte stores and state management for the SWG Shipwright application.
 * Provides reactive stores for inventory and settings data with server synchronization.
 *
 * The stores handle client-side state management while automatically persisting
 * changes to the backend through API calls. This ensures data consistency between
 * the UI and database.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/lib/stores.ts
import { writable } from 'svelte/store';
import { createLogger } from './logger.js';
import type { Inventory, Settings } from './types.js';
import type { UpdateInventoryResponse } from './types/api.js';

const storeLogger = createLogger({ component: 'stores' });

/**
 * Reactive store for inventory data.
 * Maps inventory keys (category-markLevel) to quantities.
 */
export const inventory = writable<Inventory>({});

/**
 * Reactive store for application settings.
 * Contains configuration like recommended stock levels and sell values.
 */
export const settings = writable<Settings>({
	recommendedStockLevel: 10,
	sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
});

/**
 * Increments the stock quantity for a specific inventory item by 1.
 * Updates both the local store and persists changes to the server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @param {string} vendor - The vendor location
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function incrementStock(category: string, markLevel: string, vendor: string) {
	try {
		const response = await fetch('/api/inventory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category,
				markLevel,
				action: 'increment',
				vendor
			})
		});

		if (response.ok) {
			const result: UpdateInventoryResponse = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.item.quantity;
				return inv;
			});
		}
	} catch (error) {
		storeLogger.error('Error incrementing stock', {
			error: error as Error,
			category,
			markLevel,
			vendor
		});
	}
}

/**
 * Decrements the stock quantity for a specific inventory item by 1.
 * Prevents going below zero and updates both local store and server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @param {string} vendor - The vendor location
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function decrementStock(category: string, markLevel: string, vendor: string) {
	try {
		const response = await fetch('/api/inventory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category,
				markLevel,
				action: 'decrement',
				vendor
			})
		});

		if (response.ok) {
			const result: UpdateInventoryResponse = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.item.quantity;
				return inv;
			});
		}
	} catch (error) {
		storeLogger.error('Error decrementing stock', {
			error: error as Error,
			category,
			markLevel,
			vendor
		});
	}
}

/**
 * Sets the stock quantity for a specific inventory item to an exact value.
 * Updates both the local store and persists changes to the server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @param {number} quantity - The new quantity to set
 * @param {string} vendor - The vendor location
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function setStock(
	category: string,
	markLevel: string,
	quantity: number,
	vendor: string
) {
	try {
		const response = await fetch('/api/inventory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category,
				markLevel,
				action: 'set',
				quantity,
				vendor
			})
		});

		if (response.ok) {
			const result: UpdateInventoryResponse = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.item.quantity;
				return inv;
			});
		}
	} catch (error) {
		storeLogger.error('Error setting stock', {
			error: error as Error,
			category,
			markLevel,
			quantity,
			vendor
		});
	}
}

/**
 * Loads application settings from the server.
 * Updates the settings store with the retrieved data.
 *
 * @returns {Promise<Settings>} Promise resolving to loaded settings or defaults
 */
export async function loadSettings() {
	try {
		const response = await fetch('/api/settings');
		if (response.ok) {
			const result = await response.json();
			settings.set(result.settings);
			return result.settings;
		}
	} catch (error) {
		storeLogger.error('Error loading settings', { error: error as Error });
	}
	return {
		recommendedStockLevel: 10,
		sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
	};
}

/**
 * Updates the recommended stock level setting.
 * Persists the change to the server and updates the local settings store.
 *
 * @param {number} level - The new recommended stock level
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function updateRecommendedStockLevel(level: number) {
	try {
		const response = await fetch('/api/settings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				key: 'recommendedStockLevel',
				value: level
			})
		});

		if (response.ok) {
			settings.update((s) => {
				s.recommendedStockLevel = level;
				return s;
			});
		}
	} catch (error) {
		storeLogger.error('Error updating recommended stock level', { error: error as Error, level });
	}
}

/**
 * Updates the sell values for all mark levels.
 * Persists the changes to the server and updates the local settings store.
 *
 * @param {Record<string, number>} sellValues - Object mapping mark levels to sell values
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function updateSellValues(sellValues: Record<string, number>) {
	try {
		const response = await fetch('/api/settings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sellValues
			})
		});

		if (response.ok) {
			settings.update((s) => {
				s.sellValues = sellValues as any;
				return s;
			});
		}
	} catch (error) {
		storeLogger.error('Error updating sell values', { error: error as Error, sellValues });
	}
}
