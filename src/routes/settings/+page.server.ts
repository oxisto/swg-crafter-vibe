/**
 * @fileoverview Settings page server loader for the SWG Shipwright application.
 * Loads current application settings for the settings management interface.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/settings/+page.server.ts
import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types.js';

const pageLogger = logger.child({ component: 'page', page: 'settings' });

/**
 * Page load function for the settings management page.
 * Fetches current application settings from the API with error handling.
 * Provides fallback default values if settings cannot be loaded.
 *
 * @param {object} params - Load function parameters
 * @param {Function} params.fetch - SvelteKit fetch function for server-side requests
 * @returns {Promise<object>} Page data containing application settings
 */
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch settings from our API
		const response = await fetch('/api/settings');
		const data = await response.json();

		if (!response.ok) {
			throw new Error('Failed to fetch settings');
		}

		return {
			settings: data
		};
	} catch (error) {
		pageLogger.error('Error loading settings page data', { error: error as Error });
		return {
			settings: {
				recommendedStockLevel: 10,
				sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
			}
		};
	}
};
