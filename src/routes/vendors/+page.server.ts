/**
 * @fileoverview Vendors page server loader for the SWG Shipwright application.
 * Loads vendors list and inventory data for each vendor.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types.js';
import type { GetInventoryResponse, GetSettingsResponse } from '$lib/types/api.js';

const pageLogger = logger.child({ component: 'page-server', page: 'vendors' });

/**
 * Page load function for the vendors management page.
 * Fetches vendors list, current inventory levels per vendor, and application settings.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing vendors, inventory by vendor, and settings
 */
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch vendors list
		const vendorsResponse = await fetch('/api/vendors');
		const vendors: string[] = await vendorsResponse.json();

		if (!vendorsResponse.ok) {
			throw new Error('Failed to fetch vendors data');
		}

		// Fetch settings from the settings API
		const settingsResponse = await fetch('/api/settings');
		const settingsData: GetSettingsResponse = await settingsResponse.json();

		if (!settingsResponse.ok) {
			throw new Error('Failed to fetch settings data');
		}

		// Fetch inventory for each vendor
		const vendorInventories: Record<
			string,
			{
				inventory: Record<string, number>;
				schematicNames: Record<string, string>;
				schematicIds: Record<string, string>;
			}
		> = {};

		for (const vendor of vendors) {
			try {
				// Fetch inventory data with schematic information for this vendor
				const inventoryResponse = await fetch(
					`/api/inventory?all=true&includeSchematic=true&vendor=${encodeURIComponent(vendor)}`
				);
				const inventoryData: GetInventoryResponse = await inventoryResponse.json();

				if (!inventoryResponse.ok) {
					pageLogger.warn('Failed to fetch inventory for vendor', { vendor });
					continue;
				}

				// Convert inventory array to the object format expected by the UI
				const inventory: Record<string, number> = {};
				const schematicNames: Record<string, string> = {};
				const schematicIds: Record<string, string> = {};

				const inventoryItems = inventoryData || [];
				if (Array.isArray(inventoryItems)) {
					inventoryItems.forEach((item) => {
						const key = `${item.category}-${item.markLevel}`;
						inventory[key] = item.quantity;
						if (item.displayName) {
							schematicNames[key] = item.displayName;
						}
						if (item.schematicId) {
							schematicIds[key] = item.schematicId;
						}
					});
				}

				vendorInventories[vendor] = {
					inventory,
					schematicNames,
					schematicIds
				};
			} catch (err) {
				pageLogger.error('Error loading inventory for vendor', { vendor, error: err as Error });
				vendorInventories[vendor] = {
					inventory: {},
					schematicNames: {},
					schematicIds: {}
				};
			}
		}

		return {
			vendors,
			vendorInventories,
			settings: settingsData
		};
	} catch (error) {
		pageLogger.error('Error loading vendors data', { error: error as Error });
		return {
			vendors: ['Drasi Crossing', 'Tox City'], // fallback
			vendorInventories: {},
			settings: {
				recommendedStockLevel: 10,
				sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
			}
		};
	}
};
