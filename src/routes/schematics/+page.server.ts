/**
 * @fileoverview Schematics page server loader for the SWG Shipwright application.
 * Loads all available schematics data for the schematics browser interface.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/schematics/+page.server.ts
import type { PageServerLoad } from './$types.js';

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
		// Fetch all schematics from our API
		const schematicsResponse = await fetch('/api/schematics');
		const schematics = await schematicsResponse.json();

		if (!schematicsResponse.ok) {
			console.error('Failed to fetch schematics:', schematics);
			return {
				schematics: []
			};
		}

		return {
			schematics: Array.isArray(schematics) ? schematics : []
		};
	} catch (error) {
		console.error('Error loading schematics:', error);
		return {
			schematics: []
		};
	}
};
