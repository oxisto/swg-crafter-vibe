/**
 * Schematics Favorites API Endpoint
 *
 * Handles toggling favorite status for schematics.
 * Located in the schematics API folder for better organization.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { toggleSchematicFavorite as toggleFavorite } from '$lib/data/index.js';
import { createLogger } from '$lib/logger.js';

const logger = createLogger({ component: 'schematics-favorites-api' });

/**
 * POST /api/schematics/favorites
 * Toggle favorite status of a schematic
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { schematicId } = await request.json();

		if (!schematicId || typeof schematicId !== 'string') {
			return new Response('Invalid schematic ID', { status: 400 });
		}

		const isFavorited = toggleFavorite(schematicId);

		return json({
			schematicId,
			isFavorited,
			message: isFavorited ? 'Added to favorites' : 'Removed from favorites'
		});
	} catch (error) {
		logger.error('Failed to toggle schematic favorite', { error: error as Error });
		return new Response('Internal Server Error', { status: 500 });
	}
};
