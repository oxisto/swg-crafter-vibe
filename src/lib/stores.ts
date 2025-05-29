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
import type { Inventory, Settings } from './types.js';

/**
 * Reactive store for inventory data.
 * Maps inventory keys (category-markLevel) to quantities.
 */
export const inventory = writable<Inventory>({});

/**
 * Reactive store for application settings.
 * Contains configuration like recommended stock levels.
 */
export const settings = writable<Settings>({ recommendedStockLevel: 10 });

/**
 * Increments the stock quantity for a specific inventory item by 1.
 * Updates both the local store and persists changes to the server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function incrementStock(category: string, markLevel: string) {
	try {
		const response = await fetch('/api/inventory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category,
				markLevel,
				action: 'increment'
			})
		});

		if (response.ok) {
			const result = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.quantity;
				return inv;
			});
		}
	} catch (error) {
		console.error('Error incrementing stock:', error);
	}
}

/**
 * Decrements the stock quantity for a specific inventory item by 1.
 * Prevents going below zero and updates both local store and server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function decrementStock(category: string, markLevel: string) {
	try {
		const response = await fetch('/api/inventory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category,
				markLevel,
				action: 'decrement'
			})
		});

		if (response.ok) {
			const result = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.quantity;
				return inv;
			});
		}
	} catch (error) {
		console.error('Error decrementing stock:', error);
	}
}

/**
 * Sets the stock quantity for a specific inventory item to an exact value.
 * Updates both the local store and persists changes to the server.
 *
 * @param {string} category - The part category
 * @param {string} markLevel - The mark level
 * @param {number} quantity - The new quantity to set
 * @returns {Promise<void>} Promise that resolves when operation completes
 */
export async function setStock(category: string, markLevel: string, quantity: number) {
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
				quantity
			})
		});

		if (response.ok) {
			const result = await response.json();
			inventory.update((inv) => {
				const key = `${category}-${markLevel}`;
				inv[key] = result.quantity;
				return inv;
			});
		}
	} catch (error) {
		console.error('Error setting stock:', error);
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
		console.error('Error loading settings:', error);
	}
	return { recommendedStockLevel: 10 };
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
		console.error('Error updating recommended stock level:', error);
	}
}
