/**
 * API endpoint for restoring favorites for schematics with loadouts
 */

import { markSchematicsWithLoadoutsAsFavorites } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { RequestHandler } from './$types.js';

const favoritesLogger = logger.child({ component: 'api', endpoint: 'restore-favorites' });

/**
 * POST /api/schematics/restore-favorites
 * Mark all schematics that have resource loadouts as favorites
 */
export const POST: RequestHandler = async (): Promise<Response> => {
	try {
		const updatedCount = markSchematicsWithLoadoutsAsFavorites();

		const response = {
			success: true,
			message: `Successfully marked ${updatedCount} schematics with loadouts as favorites`,
			updatedCount
		};

		return logAndSuccess(
			response,
			'Successfully restored favorites for schematics with loadouts',
			{ updatedCount },
			favoritesLogger
		);
	} catch (error) {
		return logAndError(
			'Error restoring favorites for schematics with loadouts',
			{ error: error as Error },
			favoritesLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
