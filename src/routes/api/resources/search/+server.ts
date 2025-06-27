/**
 * Resource search API endpoint
 * Searches local database for resources
 */
import * as db from '$lib/data';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/search
 * Search resources in local database
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const apiLogger = locals?.logger?.child({ component: 'api', endpoint: 'resources-search' });
	const query = url.searchParams.get('q');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	if (!query || query.length < 2) {
		return logAndError(
			'Query must be at least 2 characters long',
			{},
			apiLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	try {
		// Search local database
		const results = db.searchResources(query);

		// Apply limit
		const limitedResults = limit > 0 ? results.slice(0, limit) : results;

		const responseData = {
			query,
			results: limitedResults,
			total: results.length,
			limited: limit > 0 && results.length > limit,
			timestamp: new Date().toISOString()
		};

		return logAndSuccess(
			responseData,
			`Found ${results.length} resources for query: ${query}`,
			{},
			apiLogger
		);
	} catch (error) {
		return logAndError(
			`Resource search failed: ${(error as Error).message}`,
			{},
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
