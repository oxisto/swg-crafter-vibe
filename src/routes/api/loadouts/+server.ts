/**
 * @fileoverview Ship Loadouts API server for the SWG Shipwright application.
 * Provides REST endpoints for managing ship loadouts including
 * retrieving current stock levels and updating quantities.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { json } from '@sveltejs/kit';
import {
	getAllLoadouts,
	updateLoadoutQuantity,
	updateLoadoutPrice,
	getLoadoutById,
	createLoadout,
	deleteLoadout,
	getLoadoutsByShipType,
	initializeLoadoutDefaults
} from '$lib/data/loadouts.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types.js';

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
export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const shipType = url.searchParams.get('shipType');

		if (id) {
			// Get specific loadout by ID
			const loadout = getLoadoutById(id);
			if (!loadout) {
				return json({ error: 'Loadout not found' }, { status: 404 });
			}
			return json({ loadout });
		}

		if (shipType) {
			// Get loadouts for specific ship type
			const loadouts = getLoadoutsByShipType(shipType as any);
			return json({ loadouts });
		}

		// Get all loadouts
		const loadouts = getAllLoadouts();
		return json({ loadouts });
	} catch (error) {
		loadoutsLogger.error('Error fetching loadouts', { error: error as Error });
		return json({ error: 'Failed to fetch loadouts' }, { status: 500 });
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
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, quantity, price } = body;

		if (!id) {
			return json({ error: 'Loadout ID is required' }, { status: 400 });
		}

		// Check if loadout exists
		const existingLoadout = getLoadoutById(id);
		if (!existingLoadout) {
			return json({ error: 'Loadout not found' }, { status: 404 });
		}

		// Update quantity if provided
		if (typeof quantity === 'number') {
			if (quantity < 0) {
				return json({ error: 'Quantity cannot be negative' }, { status: 400 });
			}
			updateLoadoutQuantity(id, quantity);
			loadoutsLogger.info('Loadout quantity updated', { id, quantity });
		}

		// Update price if provided
		if (typeof price === 'number') {
			if (price < 0) {
				return json({ error: 'Price cannot be negative' }, { status: 400 });
			}
			updateLoadoutPrice(id, price);
			loadoutsLogger.info('Loadout price updated', { id, price });
		}

		// Return updated loadout
		const updatedLoadout = getLoadoutById(id);
		return json({ loadout: updatedLoadout });
	} catch (error) {
		loadoutsLogger.error('Error updating loadout', { error: error as Error });
		return json({ error: 'Failed to update loadout' }, { status: 500 });
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
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, name, shipType, variant, markLevel, price, quantity, schematicId, description } =
			body;

		// Validate required fields
		if (!id || !name || !shipType || !markLevel || typeof price !== 'number') {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Check if loadout ID already exists
		const existingLoadout = getLoadoutById(id);
		if (existingLoadout) {
			return json({ error: 'Loadout with this ID already exists' }, { status: 409 });
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
		loadoutsLogger.info('New loadout created', { id, name, shipType });

		return json({ loadout: newLoadout }, { status: 201 });
	} catch (error) {
		loadoutsLogger.error('Error creating loadout', { error: error as Error });
		return json({ error: 'Failed to create loadout' }, { status: 500 });
	}
};

/**
 * DELETE endpoint handler for removing loadouts.
 *
 * Query parameters:
 * - id: string - Loadout ID to delete
 */
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Loadout ID is required' }, { status: 400 });
		}

		// Check if loadout exists
		const existingLoadout = getLoadoutById(id);
		if (!existingLoadout) {
			return json({ error: 'Loadout not found' }, { status: 404 });
		}

		deleteLoadout(id);
		loadoutsLogger.info('Loadout deleted', { id });

		return json({ message: 'Loadout deleted successfully' });
	} catch (error) {
		loadoutsLogger.error('Error deleting loadout', { error: error as Error });
		return json({ error: 'Failed to delete loadout' }, { status: 500 });
	}
};

/**
 * Initialize loadouts with defaults on first API call if needed
 */
try {
	initializeLoadoutDefaults();
} catch (error) {
	loadoutsLogger.error('Error initializing loadout defaults', { error: error as Error });
}
