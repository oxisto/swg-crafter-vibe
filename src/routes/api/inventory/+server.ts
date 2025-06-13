/**
 * @fileoverview Inve	SCHEMATIC_ID_MAP,
	getBlasterName,
	type MarkLevel,
	type PartCategory,
	PART_CATEGORIES,
	MARK_LEVELS
} from '$lib/types.js';
import type { RequestHandler } from './$types';

const inventoryLogger = logger.child({ component: 'api', endpoint: 'inventory' });I server for the SWG Shipwright application.
 * Provides REST endpoints for managing ship part inventory including
 * retrieving current stock levels and updating quantities.
 *
 * Supports both individual item operations and bulk inventory retrieval,
 * with optional schematic data enrichment for enhanced display information.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/api/inventory/+server.ts
import { json } from '@sveltejs/kit';
import {
	updateInventoryItem,
	getInventoryItem,
	getInventoryItemWithTimestamp,
	getAllInventory,
	getAllInventoryWithTimestamps,
	getRecentlyUpdatedInventory,
	getSchematicById
} from '$lib/database.js';
import { logger } from '$lib/logger.js';
import {
	SCHEMATIC_ID_MAP,
	getBlasterName,
	type MarkLevel,
	type PartCategory,
	PART_CATEGORIES,
	MARK_LEVELS
} from '$lib/types.js';
import type { RequestHandler } from './$types.js';

const inventoryLogger = logger.child({ component: 'api', endpoint: 'inventory' });

/**
 * GET endpoint handler for retrieving inventory data.
 * Supports querying individual items or full inventory with optional schematic enrichment.
 *
 * Query parameters:
 * - category: Part category filter (PartCategory)
 * - markLevel: Mark level filter (MarkLevel)
 * - includeSchematic: Include schematic data in response (boolean)
 * - includeTimestamp: Include update timestamps in response (boolean)
 * - all: Return full inventory instead of single item (boolean)
 * - recent: Return recently updated items (boolean, optional limit parameter)
 *
 * @param {object} params - Request parameters
 * @param {URL} params.url - Request URL containing query parameters
 * @returns {Promise<Response>} JSON response with inventory data
 */
export const GET: RequestHandler = async ({ url }) => {
	const category = url.searchParams.get('category') as PartCategory;
	const markLevel = url.searchParams.get('markLevel') as MarkLevel;
	const includeSchematic = url.searchParams.get('includeSchematic') === 'true';
	const includeTimestamp = url.searchParams.get('includeTimestamp') === 'true';
	const includeAll = url.searchParams.get('all') === 'true';
	const recent = url.searchParams.get('recent') === 'true';
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);

	try {
		// If requesting recently updated items
		if (recent) {
			const recentItems = getRecentlyUpdatedInventory(limit);

			if (includeSchematic) {
				const enrichedItems = recentItems.map((item) => {
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

					return {
						...item,
						displayName,
						schematic,
						schematicId
					};
				});

				return json({ recentUpdates: enrichedItems });
			}

			return json({ recentUpdates: recentItems });
		}

		// If requesting all inventory data
		if (includeAll) {
			if (includeTimestamp) {
				const inventoryWithTimestamps = getAllInventoryWithTimestamps();

				if (includeSchematic) {
					const enrichedInventory = inventoryWithTimestamps.map((item) => {
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
									displayName = getBlasterName(
										item.markLevel as MarkLevel,
										color as 'Green' | 'Red'
									);
								}
							}
						}

						return {
							...item,
							displayName,
							schematic,
							schematicId
						};
					});

					return json({ inventory: enrichedInventory });
				}

				return json({ inventory: inventoryWithTimestamps });
			}

			const inventory = getAllInventory();

			if (includeSchematic) {
				// Add schematic data for each inventory item
				const inventoryWithSchematics = Object.entries(inventory).map(([key, quantity]) => {
					const [cat, mark] = key.split('-');
					const schematicId = SCHEMATIC_ID_MAP[key];

					let schematic = null;
					let displayName = `Mark ${mark} ${cat}`;

					if (schematicId) {
						schematic = getSchematicById(schematicId);
						if (schematic) {
							displayName = schematic.name;
							// For blasters, use custom naming
							if (cat.startsWith('Blaster')) {
								const color = cat.includes('Green') ? 'Green' : 'Red';
								displayName = getBlasterName(mark as MarkLevel, color as 'Green' | 'Red');
							}
						}
					}

					return {
						category: cat,
						markLevel: mark,
						quantity,
						displayName,
						schematic,
						schematicId
					};
				});

				return json({ inventory: inventoryWithSchematics });
			}

			// Return just inventory quantities
			return json({ inventory });
		}

		// If requesting specific item
		if (!category || !markLevel) {
			return json(
				{ error: 'Missing category or markLevel parameters. Use ?all=true for full inventory.' },
				{ status: 400 }
			);
		}

		// Get item data with or without timestamp
		if (includeTimestamp) {
			const itemData = getInventoryItemWithTimestamp(category, markLevel);

			if (!itemData) {
				return json({ error: 'Item not found' }, { status: 404 });
			}

			let response: any = {
				category,
				markLevel,
				quantity: itemData.quantity,
				updatedAt: itemData.updatedAt
			};

			// Add schematic data if requested
			if (includeSchematic) {
				const inventoryKey = `${category}-${markLevel}`;
				const schematicId = SCHEMATIC_ID_MAP[inventoryKey];

				if (schematicId) {
					const schematic = getSchematicById(schematicId);

					if (schematic) {
						let displayName = schematic.name;

						// For blasters, use custom naming
						if (category.startsWith('Blaster')) {
							const color = category.includes('Green') ? 'Green' : 'Red';
							displayName = getBlasterName(markLevel, color as 'Green' | 'Red');
						}

						response.displayName = displayName;
						response.schematic = {
							id: schematic.id,
							name: schematic.name,
							category: schematic.category,
							profession: schematic.profession,
							complexity: schematic.complexity,
							datapad: schematic.datapad
						};
						response.schematicId = schematicId;
					}
				}
			}

			return json(response);
		}

		const quantity = getInventoryItem(category, markLevel);
		const inventoryKey = `${category}-${markLevel}`;

		let response: any = {
			category,
			markLevel,
			quantity
		};

		// Add schematic data if requested
		if (includeSchematic) {
			const schematicId = SCHEMATIC_ID_MAP[inventoryKey];

			if (schematicId) {
				const schematic = getSchematicById(schematicId);

				if (schematic) {
					let displayName = schematic.name;

					// For blasters, use custom naming
					if (category.startsWith('Blaster')) {
						const color = category.includes('Green') ? 'Green' : 'Red';
						displayName = getBlasterName(markLevel, color as 'Green' | 'Red');
					}

					response.displayName = displayName;
					response.schematic = {
						id: schematic.id,
						name: schematic.name,
						category: schematic.category,
						profession: schematic.profession,
						complexity: schematic.complexity,
						datapad: schematic.datapad
					};
					response.schematicId = schematicId;
				}
			}
		}

		return json(response);
	} catch (error) {
		inventoryLogger.error('Error fetching inventory', { error: error as Error });
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

/**
 * POST endpoint handler for updating inventory quantities.
 * Supports increment, decrement, and direct set operations on inventory items.
 *
 * Request body:
 * - category: Part category (PartCategory) - required
 * - markLevel: Mark level (MarkLevel) - required
 * - action: Operation type ('increment' | 'decrement' | 'set') - required
 * - quantity: New quantity value (number) - required for 'set' action
 *
 * @param {object} params - Request parameters
 * @param {Request} params.request - The incoming HTTP request
 * @returns {Promise<Response>} JSON response with updated inventory data
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { category, markLevel, action, quantity } = await request.json();

		if (!category || !markLevel || !action) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		let newQuantity: number;
		const currentQuantity = getInventoryItem(category, markLevel);

		switch (action) {
			case 'increment':
				newQuantity = currentQuantity + 1;
				break;
			case 'decrement':
				newQuantity = Math.max(0, currentQuantity - 1);
				break;
			case 'set':
				if (typeof quantity !== 'number' || quantity < 0) {
					return json({ error: 'Invalid quantity' }, { status: 400 });
				}
				newQuantity = quantity;
				break;
			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

		updateInventoryItem(category, markLevel, newQuantity);

		// Get the updated item with timestamp
		const updatedItem = getInventoryItemWithTimestamp(category, markLevel);

		return json({
			success: true,
			category,
			markLevel,
			quantity: newQuantity,
			updatedAt: updatedItem?.updatedAt || new Date().toISOString()
		});
	} catch (error) {
		inventoryLogger.error('Error updating inventory', { error: error as Error });
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
