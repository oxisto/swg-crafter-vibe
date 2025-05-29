/**
 * @fileoverview Inventory page server loader for the SWG Shipwright application.
 * Loads inventory data and settings required for the inventory management interface.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/inventory/+page.server.ts
import type { PageServerLoad } from './$types.js';

/**
 * Page load function for the inventory management page.
 * Fetches current inventory levels and application settings from the API.
 * Handles both array and object format responses for backwards compatibility.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing inventory and settings
 */
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch inventory data with schematic information from our API
		const inventoryResponse = await fetch('/api/inventory?all=true&includeSchematic=true');
		const inventoryData = await inventoryResponse.json();

		// Fetch settings from the settings API
		const settingsResponse = await fetch('/api/settings');
		const settingsData = await settingsResponse.json();

		if (!inventoryResponse.ok) {
			throw new Error('Failed to fetch inventory data');
		}

		if (!settingsResponse.ok) {
			throw new Error('Failed to fetch settings data');
		}

		// Convert inventory array back to the object format expected by the UI
		const inventory: Record<string, number> = {};
		const schematicNames: Record<string, string> = {};
		const schematicIds: Record<string, string> = {};

		if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
			inventoryData.inventory.forEach((item: any) => {
				const key = `${item.category}-${item.markLevel}`;
				inventory[key] = item.quantity;
				// Store the display name for each inventory item
				if (item.displayName) {
					schematicNames[key] = item.displayName;
				}
				// Store the schematic ID for each inventory item
				if (item.schematicId) {
					schematicIds[key] = item.schematicId;
				}
			});
		} else if (inventoryData.inventory && typeof inventoryData.inventory === 'object') {
			// If it's already in object format
			Object.assign(inventory, inventoryData.inventory);
		}

		return {
			inventory,
			schematicNames,
			schematicIds,
			settings: settingsData
		};
	} catch (error) {
		console.error('Error loading inventory data:', error);
		return {
			inventory: {},
			schematicNames: {},
			schematicIds: {},
			settings: { recommendedStockLevel: 10 }
		};
	}
};
