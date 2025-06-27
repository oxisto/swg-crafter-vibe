/**
 * @fileoverview Ship Loadouts page server loader for the SWG Shipwright application.
 * Loads ship loadout data for the dedicated loadouts management interface.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types.js';
import type { GetLoadoutsResponse, GetChassisResponse } from '$lib/types/api.js';

const pageLogger = logger.child({ component: 'page-server', page: 'loadouts' });

/**
 * Page load function for the ship loadouts management page.
 * Fetches current loadout and chassis data from the API.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing loadouts and chassis
 */
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch loadouts data from the loadouts API
		const loadoutsResponse = await fetch('/api/loadouts');
		const loadoutsData: GetLoadoutsResponse = await loadoutsResponse.json();

		if (!loadoutsResponse.ok) {
			throw new Error('Failed to fetch loadouts data');
		}

		// Fetch chassis data from the chassis API (with error handling)
		let chassisData: GetChassisResponse = [];
		try {
			const chassisResponse = await fetch('/api/chassis');
			if (chassisResponse.ok) {
				chassisData = await chassisResponse.json();
			} else {
				pageLogger.warn('Failed to fetch chassis data, continuing without chassis');
			}
		} catch (chassisError) {
			pageLogger.warn('Error fetching chassis data', { error: chassisError as Error });
		}

		return {
			loadouts: loadoutsData || [],
			chassis: chassisData || []
		};
	} catch (error) {
		pageLogger.error('Error loading loadouts and chassis data', { error: error as Error });
		return {
			loadouts: [],
			chassis: []
		};
	}
};
