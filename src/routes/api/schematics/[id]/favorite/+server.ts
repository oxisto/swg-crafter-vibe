/**
 * Schematic Favorite API Endpoint
 *
 * RESTful endpoint for toggling favorite status of a specific schematic.
 * Uses path parameter for the schematic ID.
 */

import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from '@sveltejs/kit';
import { toggleSchematicFavorite as toggleFavorite } from '$lib/data/index.js';

const favoritesLogger = logger.child({ component: 'api', endpoint: 'schematic-favorite' });

/**
 * POST /api/schematics/[id]/favorite
 * Toggle favorite status of a schematic using path parameter
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	const apiLogger =
		locals?.logger?.child({ component: 'api', endpoint: 'schematic-favorite' }) || favoritesLogger;

	try {
		const { id: schematicId } = params;

		// Validate parameter exists
		if (!schematicId) {
			return logAndError(
				'Schematic ID is required',
				{ schematicId },
				apiLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Convert to integer and validate
		const id = parseInt(schematicId, 10);
		if (isNaN(id) || id <= 0) {
			return logAndError(
				'Invalid schematic ID - must be a positive integer',
				{ schematicId },
				apiLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Use the integer ID as a string for the database query (SQLite handles this conversion)
		const isFavorite = toggleFavorite(id.toString());

		return logAndSuccess(
			{
				schematicId: id,
				isFavorite,
				message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
			},
			`${isFavorite ? 'Added to' : 'Removed from'} favorites: schematic ${id}`,
			{ schematicId: id, isFavorite },
			apiLogger
		);
	} catch (error) {
		return logAndError(
			`Failed to toggle schematic favorite: ${(error as Error).message}`,
			{ schematicId: params.id, error: error as Error },
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
