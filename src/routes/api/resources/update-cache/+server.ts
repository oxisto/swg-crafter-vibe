/**
 * Resource cache update API endpoint
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/database';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/update-cache
 * Returns the last update time for the resource cache
 */
export const GET: RequestHandler = async () => {
	const lastUpdate = db
		.getDatabase()
		.prepare('SELECT value FROM resources_cache WHERE key = ?')
		.get('resources_last_update') as { value: string } | undefined;

	return json({
		success: true,
		lastUpdate: lastUpdate?.value || null
	});
};

/**
 * POST /api/resources/update-cache
 * Manually triggers a resource cache update
 */
export const POST: RequestHandler = async () => {
	try {
		await db.downloadAndCacheResources();

		// Get the updated timestamp
		const lastUpdate = db
			.getDatabase()
			.prepare('SELECT value FROM resources_cache WHERE key = ?')
			.get('resources_last_update') as { value: string } | undefined;

		return json({
			success: true,
			message: 'Resource cache update completed successfully',
			lastUpdate: lastUpdate?.value || null
		});
	} catch (error) {
		console.error('Failed to update resource cache:', error);
		return json(
			{
				success: false,
				message: 'Failed to update resource cache',
				error: (error as Error).message
			},
			{ status: 500 }
		);
	}
};
