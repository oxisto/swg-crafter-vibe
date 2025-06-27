/**
 * @fileoverview Ship Loadouts API server for the SWG Shipwright application.
 * Provides REST endpoints for managing ship loadouts including
 * retrieving current stock levels and updating quantities.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import {
	getAllLoadouts,
	updateLoadoutQuantity,
	updateLoadoutPrice,
	getLoadoutById,
	createLoadout,
	deleteLoadout,
	getLoadoutsByShipType
} from '$lib/data/loadouts.js';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { RequestHandler } from './$types.js';
import type {
	GetLoadoutsResponse,
	GetLoadoutResponse,
	UpdateLoadoutResponse,
	CreateLoadoutResponse
} from '$lib/types/api.js';

const loadoutsLogger = logger.child({ component: 'api', endpoint: 'loadouts' });

/**
 * GET endpoint handler for retrieving loadout data.
 * Supports querying individual loadouts or all loadouts.
 *
 * Query parameters:
 * - id: string - Specific loadout ID
 * - shipType: string - Filter by ship type
 * - all: boolean - Return all loadouts (default behavior)
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		const id = url.searchParams.get('id');
		const shipType = url.searchParams.get('shipType');

		if (id) {
			// Get specific loadout by ID
			const loadout = getLoadoutById(id);
			if (!loadout) {
				return logAndError('Loadout not found', { id }, loadoutsLogger, HttpStatus.NOT_FOUND);
			}

			return logAndSuccess(
				loadout satisfies GetLoadoutResponse,
				'Successfully fetched loadout',
				{ id },
				loadoutsLogger
			);
		}

		if (shipType) {
			// Get loadouts for specific ship type
			const loadouts = getLoadoutsByShipType(shipType as any);
			return logAndSuccess(
				loadouts satisfies GetLoadoutsResponse,
				'Successfully fetched loadouts by ship type',
				{ shipType, count: loadouts.length },
				loadoutsLogger
			);
		}

		// Get all loadouts
		const loadouts = getAllLoadouts();
		return logAndSuccess(
			loadouts satisfies GetLoadoutsResponse,
			'Successfully fetched all loadouts',
			{ count: loadouts.length },
			loadoutsLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching loadouts',
			{ error: err as Error },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * PATCH endpoint handler for updating loadout data.
 * Supports updating quantity and price.
 *
 * Request body should contain:
 * - id: string - Loadout ID to update
 * - quantity?: number - New quantity (optional)
 * - price?: number - New price (optional)
 */
export const PATCH: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const body = await request.json();
		const { id, quantity, price } = body;

		if (!id) {
			return logAndError(
				'Loadout ID is required',
				{ body },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Check if loadout exists
		const existingLoadout = getLoadoutById(id);
		if (!existingLoadout) {
			return logAndError('Loadout not found', { id }, loadoutsLogger, HttpStatus.NOT_FOUND);
		}

		// Update quantity if provided
		if (typeof quantity === 'number') {
			if (quantity < 0) {
				return logAndError(
					'Quantity cannot be negative',
					{ id, quantity },
					loadoutsLogger,
					HttpStatus.BAD_REQUEST
				);
			}
			updateLoadoutQuantity(id, quantity);
		}

		// Update price if provided
		if (typeof price === 'number') {
			if (price < 0) {
				return logAndError(
					'Price cannot be negative',
					{ id, price },
					loadoutsLogger,
					HttpStatus.BAD_REQUEST
				);
			}
			updateLoadoutPrice(id, price);
		}

		// Return updated loadout
		const updatedLoadout = getLoadoutById(id);

		if (!updatedLoadout) {
			return logAndError(
				'Loadout not found after update',
				{ id },
				loadoutsLogger,
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}

		return logAndSuccess(
			updatedLoadout satisfies UpdateLoadoutResponse,
			'Successfully updated loadout',
			{
				id,
				quantityUpdated: typeof quantity === 'number',
				priceUpdated: typeof price === 'number'
			},
			loadoutsLogger
		);
	} catch (err) {
		return logAndError(
			'Error updating loadout',
			{ error: err as Error },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * POST endpoint handler for creating new loadouts.
 *
 * Request body should contain loadout data:
 * - id: string - Unique loadout ID
 * - name: string - Display name
 * - shipType: string - Ship type
 * - variant?: string - Ship variant (optional)
 * - markLevel: string - Mark level (I-V)
 * - price: number - Price in credits
 * - quantity?: number - Initial quantity (default: 0)
 * - schematicId?: string - Related schematic ID (optional)
 * - description?: string - Description (optional)
 */
export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const body = await request.json();
		const { id, name, shipType, variant, markLevel, price, quantity, schematicId, description } =
			body;

		// Validate required fields
		if (!id || !name || !shipType || !markLevel || typeof price !== 'number') {
			return logAndError(
				'Missing required fields',
				{
					body: {
						id: !!id,
						name: !!name,
						shipType: !!shipType,
						markLevel: !!markLevel,
						priceValid: typeof price === 'number'
					}
				},
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Check if loadout ID already exists
		const existingLoadout = getLoadoutById(id);
		if (existingLoadout) {
			return logAndError(
				'Loadout with this ID already exists',
				{ id },
				loadoutsLogger,
				HttpStatus.CONFLICT
			);
		}

		// Create new loadout
		const newLoadout = {
			id,
			name,
			shipType,
			variant,
			markLevel,
			price,
			quantity: quantity || 0,
			schematicId,
			description
		};

		createLoadout(newLoadout);

		return logAndSuccess(
			newLoadout satisfies CreateLoadoutResponse,
			'Successfully created loadout',
			{ id, name, shipType },
			loadoutsLogger
		);
	} catch (err) {
		return logAndError(
			'Error creating loadout',
			{ error: err as Error },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * DELETE endpoint handler for removing loadouts.
 *
 * Query parameters:
 * - id: string - Loadout ID to delete
 */
export const DELETE: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return logAndError(
				'Loadout ID is required',
				{ query: Object.fromEntries(url.searchParams) },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Check if loadout exists
		const existingLoadout = getLoadoutById(id);
		if (!existingLoadout) {
			return logAndError('Loadout not found', { id }, loadoutsLogger, HttpStatus.NOT_FOUND);
		}

		deleteLoadout(id);

		return logAndSuccess(
			{ message: 'Loadout deleted successfully' },
			'Successfully deleted loadout',
			{ id },
			loadoutsLogger
		);
	} catch (err) {
		return logAndError(
			'Error deleting loadout',
			{ error: err as Error },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
