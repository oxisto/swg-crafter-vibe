/**
 * Resource search API endpoint
 * Searches local database for resources
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/data';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/search
 * Search resources in local database
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	if (!query || query.length < 2) {
		return json(
			{
				success: false,
				error: 'Query must be at least 2 characters long'
			},
			{ status: 400 }
		);
	}

	try {
		// Search local database
		const results = db.searchResources(query);

		// Apply limit
		const limitedResults = limit > 0 ? results.slice(0, limit) : results;

		return json({
			success: true,
			query,
			results: limitedResults,
			total: results.length,
			limited: limit > 0 && results.length > limit,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Resource search failed:', error);
		return json(
			{
				success: false,
				error: 'Search operation failed'
			},
			{ status: 500 }
		);
	}
};
