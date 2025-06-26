/**
 * Schematic Favorite API Endpoint
 *
 * RESTful endpoint for toggling favorite status of a specific schematic.
 * Uses path parameter for the schematic ID.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { toggleSchematicFavorite as toggleFavorite } from '$lib/data/index.js';
import { createLogger } from '$lib/logger.js';

const logger = createLogger({ component: 'schematic-favorite-api' });

/**
 * POST /api/schematics/[id]/favorite
 * Toggle favorite status of a schematic using path parameter
 */
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { id: schematicId } = params;

		// Validate parameter exists
		if (!schematicId) {
			return new Response('Schematic ID is required', { status: 400 });
		}

		// Convert to integer and validate
		const id = parseInt(schematicId, 10);
		if (isNaN(id) || id <= 0) {
			return new Response('Invalid schematic ID - must be a positive integer', { status: 400 });
		}

		// Use the integer ID as a string for the database query (SQLite handles this conversion)
		const isFavorite = toggleFavorite(id.toString());

		return json({
			schematicId: id,
			isFavorite,
			message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
		});
	} catch (error) {
		logger.error('Failed to toggle schematic favorite', { error: error as Error });
		return new Response('Internal Server Error', { status: 500 });
	}
};
