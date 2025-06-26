/**
 * Resource cache update API endpoint
 */
import { json } from '@sveltejs/kit';
import { getDatabase, downloadAndCacheResources } from '$lib/data';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/update-cache
 * Returns the last update time for the resource cache
 */
export const GET: RequestHandler = async () => {
	const lastUpdate = getDatabase()
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
export const POST: RequestHandler = async ({ locals }) => {
	const apiLogger = locals?.logger?.child({ component: 'api', endpoint: 'resources-cache' });

	try {
		apiLogger?.info('Starting manual resources cache update');
		await downloadAndCacheResources();

		// Get the updated timestamp
		const lastUpdate = getDatabase()
			.prepare('SELECT value FROM resources_cache WHERE key = ?')
			.get('resources_last_update') as { value: string } | undefined;

		apiLogger?.info('Resources cache update completed successfully');
		return json({
			success: true,
			message: 'Resource cache update completed successfully',
			lastUpdate: lastUpdate?.value || null
		});
	} catch (error) {
		apiLogger?.error(`Resource cache update failed: ${(error as Error).message}`);
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
