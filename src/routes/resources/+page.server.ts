/**
 * @fileoverview Resources page server loader for the SWG Shipwright application.
 * Loads resource data for the resources browser interface using API endpoints.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/resources/+page.server.ts
import { logger } from '$lib/logger.js';
import type { GetResourcesResponse } from '$lib/types/api.js';
import type { PageServerLoad } from './$types';

const pageLogger = logger.child({ component: 'page-server', page: 'resources' });

/**
 * Page load function for the resources browser page.
 * Fetches resource data from the API with optional filtering.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @param {URL} params.url - URL object with search parameters
 * @returns {Promise<object>} Page data containing resources and filter state
 */
export const load: PageServerLoad = async ({ url, fetch }) => {
	try {
		const className = url.searchParams.get('class') || '';
		const searchTerm = url.searchParams.get('search') || '';
		const spawnStatus = url.searchParams.get('status') || 'all';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		// Build API request URL with filters and pagination
		const apiParams = new URLSearchParams();
		if (className) apiParams.set('class', className);
		if (searchTerm) apiParams.set('search', searchTerm);
		if (spawnStatus !== 'all') apiParams.set('status', spawnStatus);
		apiParams.set('page', page.toString());
		apiParams.set('limit', limit.toString());

		// Fetch resources from our API
		const response = await fetch(`/api/resources?${apiParams}`);

		if (!response.ok) {
			throw new Error('Failed to fetch resources data');
		}

		const data: GetResourcesResponse = await response.json();

		return {
			resources: data.resources || [],
			total: data.total || 0,
			pagination: {
				page: data.page || 1,
				limit: data.limit || 50,
				totalPages: data.totalPages || 1
			},
			filters: {
				className,
				searchTerm,
				spawnStatus
			}
		};
	} catch (error) {
		pageLogger.error('Error loading resources data', { error: error as Error });
		return {
			resources: [],
			total: 0,
			pagination: {
				page: 1,
				limit: 50,
				totalPages: 1
			},
			filters: {
				className: '',
				searchTerm: '',
				spawnStatus: 'all'
			}
		};
	}
};
