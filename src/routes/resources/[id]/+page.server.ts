/**
 * @fileoverview Resource detail page server loader for the SWG Shipwright application.
 * Loads individual resource data and related resources using API endpoints.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/resources/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types';

const pageLogger = logger.child({ component: 'page-server', page: 'resource-detail' });

/**
 * Page load function for the resource detail page.
 * Fetches individual resource data and related resources from the API.
 *
 * @param {object} params - Load function parameters
 * @param {object} params.params - Route parameters containing resource ID
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing resource and related resources
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const id = params.id;

		if (!id) {
			throw error(404, 'Resource not found');
		}

		// Parse ID as integer
		const resourceId = parseInt(id, 10);
		if (isNaN(resourceId) || resourceId <= 0) {
			throw error(400, 'Invalid resource ID');
		}

		// Fetch the specific resource from our API
		const resourceResponse = await fetch(`/api/resources/${resourceId}`);

		if (!resourceResponse.ok) {
			if (resourceResponse.status === 404) {
				throw error(404, 'Resource not found');
			}
			throw error(resourceResponse.status, 'Failed to load resource');
		}

		const resourceData = await resourceResponse.json();
		const resource = resourceData.resource || resourceData;

		if (!resource) {
			throw error(404, 'Resource not found');
		}

		// Fetch related resources of the same class for comparison
		const relatedResponse = await fetch(
			`/api/resources?class=${encodeURIComponent(resource.className)}`
		);
		let relatedResources = [];

		if (relatedResponse.ok) {
			const relatedData = await relatedResponse.json();
			const allRelated = relatedData.resources || relatedData;

			if (Array.isArray(allRelated)) {
				relatedResources = allRelated
					.filter((r) => r.id !== resource.id)
					.sort((a, b) => {
						// Sort by overall quality descending
						const qualityA = a.stats?.overallQuality || 0;
						const qualityB = b.stats?.overallQuality || 0;
						return qualityB - qualityA;
					})
					.slice(0, 5); // Limit to top 5 related resources
			}
		}

		return {
			resource,
			relatedResources
		};
	} catch (err) {
		pageLogger.error('Error loading resource data', { error: err as Error, resourceId: params.id });

		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// For other errors, return a 500
		throw error(500, 'Failed to load resource data');
	}
};
