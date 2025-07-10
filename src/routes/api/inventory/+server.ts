/**
 * @fileoverview Inventory API endpoints for the SWG Shipwright application.
 * Provides REST endpoints for managing ship part inventory including
 * retrieving current stock levels and updating quantities.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import {
	updateInventoryItem,
	getInventoryItem,
	getAllInventory,
	getAllInventoryItems,
	getAllInventoryItemsWithTimestamps,
	getRecentInventoryItems,
	getInventoryItemWithSchematic,
	getInventoryItemWithTimestampAndSchematic
} from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { type MarkLevel, type PartCategory } from '$lib/types.js';
import type {
	GetInventoryResponse,
	GetInventoryWithTimestampsResponse,
	GetRecentInventoryResponse,
	UpdateInventoryResponse
} from '$lib/types/api.js';
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
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	const category = url.searchParams.get('category') as PartCategory;
	const markLevel = url.searchParams.get('markLevel') as MarkLevel;
	const includeSchematic = url.searchParams.get('includeSchematic') === 'true';
	const includeTimestamp = url.searchParams.get('includeTimestamp') === 'true';
	const includeAll = url.searchParams.get('all') === 'true';
	const recent = url.searchParams.get('recent') === 'true';
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);
	const vendor = url.searchParams.get('vendor');

	try {
		// If requesting recently updated items
		if (recent) {
			const recentItems = getRecentInventoryItems(limit, includeSchematic);
			return logAndSuccess(
				recentItems satisfies GetRecentInventoryResponse,
				'Successfully fetched recent inventory items',
				{ count: recentItems.length, limit },
				inventoryLogger
			);
		}

		// If requesting all inventory data
		if (includeAll) {
			if (includeTimestamp) {
				const inventoryWithTimestamps = getAllInventoryItemsWithTimestamps(
					includeSchematic,
					vendor || undefined
				);
				return logAndSuccess(
					inventoryWithTimestamps satisfies GetInventoryWithTimestampsResponse,
					'Successfully fetched inventory with timestamps',
					{ count: inventoryWithTimestamps.length, includeSchematic, vendor },
					inventoryLogger
				);
			}

			if (includeSchematic) {
				const inventoryItems = getAllInventoryItems(includeSchematic, vendor || undefined);
				return logAndSuccess(
					inventoryItems satisfies GetInventoryResponse,
					'Successfully fetched inventory with schematics',
					{ count: inventoryItems.length, vendor },
					inventoryLogger
				);
			}

			// Return just inventory quantities for backward compatibility
			const inventory = getAllInventory();
			return logAndSuccess(
				inventory,
				'Successfully fetched inventory quantities',
				{ count: Object.keys(inventory).length },
				inventoryLogger
			);
		}

		// If requesting specific item
		if (!category || !markLevel) {
			return logAndError(
				'Missing category or markLevel parameters. Use ?all=true for full inventory.',
				{ category, markLevel },
				inventoryLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Get item data with or without timestamp
		if (includeTimestamp) {
			const itemData = getInventoryItemWithTimestampAndSchematic(
				category,
				markLevel,
				includeSchematic
			);

			if (!itemData) {
				return logAndError(
					'Item not found',
					{ category, markLevel },
					inventoryLogger,
					HttpStatus.NOT_FOUND
				);
			}

			return logAndSuccess(
				itemData,
				'Successfully fetched inventory item with timestamp',
				{ category, markLevel, includeSchematic },
				inventoryLogger
			);
		}

		const itemData = getInventoryItemWithSchematic(category, markLevel, includeSchematic);

		if (!itemData) {
			return logAndError(
				'Item not found',
				{ category, markLevel },
				inventoryLogger,
				HttpStatus.NOT_FOUND
			);
		}

		return logAndSuccess(
			itemData,
			'Successfully fetched inventory item',
			{ category, markLevel, includeSchematic },
			inventoryLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching inventory data',
			{ error: err as Error },
			inventoryLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
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
export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const { category, markLevel, action, quantity, vendor } = await request.json();

		if (!category || !markLevel || !action) {
			return logAndError(
				'Missing required fields',
				{ category, markLevel, action, vendor },
				inventoryLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		let newQuantity: number;
		const currentQuantity = getInventoryItem(category, markLevel, vendor);

		switch (action) {
			case 'increment':
				newQuantity = currentQuantity + 1;
				break;
			case 'decrement':
				newQuantity = Math.max(0, currentQuantity - 1);
				break;
			case 'set':
				if (typeof quantity !== 'number' || quantity < 0) {
					return logAndError(
						'Invalid quantity',
						{ category, markLevel, quantity, vendor },
						inventoryLogger,
						HttpStatus.BAD_REQUEST
					);
				}
				newQuantity = quantity;
				break;
			default:
				return logAndError(
					'Invalid action',
					{ category, markLevel, action, vendor },
					inventoryLogger,
					HttpStatus.BAD_REQUEST
				);
		}

		updateInventoryItem(category, markLevel, newQuantity, vendor);

		// Get the updated item with timestamp for response
		const updatedItem = getInventoryItemWithTimestampAndSchematic(
			category,
			markLevel,
			false,
			vendor
		);

		const response: UpdateInventoryResponse = {
			item: {
				category,
				markLevel,
				quantity: newQuantity
			},
			previousQuantity: currentQuantity
		};

		return logAndSuccess(
			response,
			'Successfully updated inventory item',
			{ category, markLevel, action, newQuantity, previousQuantity: currentQuantity, vendor },
			inventoryLogger
		);
	} catch (err) {
		return logAndError(
			'Error updating inventory',
			{ error: err as Error },
			inventoryLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
