/**
 * Resource cache update API endpoint
 */
import { getDatabase, downloadAndCacheResources } from '$lib/data';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/update-cache
 * Returns the last update time for the resource cache
 */
export const GET: RequestHandler = async ({ locals }) => {
	const apiLogger = locals?.logger?.child({ component: 'api', endpoint: 'resources-cache' });

	const lastUpdate = getDatabase()
		.prepare('SELECT value FROM resources_cache WHERE key = ?')
		.get('resources_last_update') as { value: string } | undefined;

	return logAndSuccess(
		{
			lastUpdate: lastUpdate?.value || null
		},
		'Retrieved resource cache status',
		{},
		apiLogger
	);
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

		return logAndSuccess(
			{
				message: 'Resource cache update completed successfully',
				lastUpdate: lastUpdate?.value || null
			},
			'Resources cache update completed successfully',
			{},
			apiLogger
		);
	} catch (error) {
		return logAndError(
			`Resource cache update failed: ${(error as Error).message}`,
			{},
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
