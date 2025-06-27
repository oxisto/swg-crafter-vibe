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
 * Fetches all available schematics data from the API.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing schematics array
 */
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch all schematics from our API (now includes favorites)
		const schematicsResponse = await fetch('/api/schematics');
		const data: GetSchematicsResponse = await schematicsResponse.json();

		if (!schematicsResponse.ok) {
			pageLogger.error('Failed to fetch schematics from API', {
				status: schematicsResponse.status,
				statusText: schematicsResponse.statusText
			});
			return {
				schematics: []
			};
		}

		return {
			schematics: data.schematics || []
		};
	} catch (error) {
		pageLogger.error('Error loading schematics page data', { error: error as Error });
		return {
			schematics: []
		};
	}
};
