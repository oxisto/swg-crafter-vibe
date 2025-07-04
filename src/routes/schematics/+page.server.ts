/**
 * @fileoverview Schematics page server loader for the SWG Shipwright application.
 * Loads all available schematics data for the schematics browser interface.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/schematics/+page.server.ts
import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types.js';
import type { GetSchematicsResponse } from '$lib/types/api.js';

const pageLogger = logger.child({ component: 'page', page: 'schematics' });

/**
 * Page load function for the schematics browser page.
 * Fetches schematics data with pagination and filtering support.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @param {URL} params.url - Request URL containing query parameters
 * @returns {Promise<object>} Page data containing schematics array and pagination info
 */
export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		// Extract query parameters for API forwarding
		const searchParams = new URLSearchParams();

		// Get filter parameters from URL
		const search = url.searchParams.get('search');
		const category = url.searchParams.get('category');
		const page = url.searchParams.get('page') || '1';
		const limit = url.searchParams.get('limit') || '50';

		// Add parameters to API request
		if (search) searchParams.set('search', search);
		if (category) searchParams.set('category', category);
		searchParams.set('page', page);
		searchParams.set('limit', limit);

		// Fetch schematics from our API with pagination
		const apiUrl = `/api/schematics?${searchParams.toString()}`;
		const schematicsResponse = await fetch(apiUrl);
		const data: GetSchematicsResponse = await schematicsResponse.json();

		if (!schematicsResponse.ok) {
			pageLogger.error('Failed to fetch schematics from API', {
				status: schematicsResponse.status,
				statusText: schematicsResponse.statusText,
				apiUrl
			});
			return {
				schematics: [],
				total: 0,
				pagination: { page: 1, limit: 50, totalPages: 0 },
				filters: {}
			};
		}

		return {
			schematics: data.schematics || [],
			total: data.total || 0,
			pagination: {
				page: data.page || 1,
				limit: data.limit || 50,
				totalPages: data.totalPages || 0
			},
			filters: {
				searchTerm: search,
				category: category
			}
		};
	} catch (error) {
		pageLogger.error('Error loading schematics page data', { error: error as Error });
		return {
			schematics: [],
			total: 0,
			pagination: { page: 1, limit: 50, totalPages: 0 },
			filters: {}
		};
	}
};
