/**
 * @fileoverview Settings API server for the SWG Shipwright application.
 * Provides REST endpoints for managing application settings including
 * recommended stock levels and other configuration options.
 *
 * Handles both retrieval and updates of persistent settings stored in the database.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/api/settings/+server.ts
import { json } from '@sveltejs/kit';
import {
	getSetting,
	setSetting,
	getRecommendedStockLevel,
	setRecommendedStockLevel
} from '$lib/database.js';
import type { RequestHandler } from './$types.js';

/**
 * GET endpoint handler for retrieving application settings.
 * Currently returns the recommended stock level configuration.
 *
 * @returns {Promise<Response>} JSON response with current settings
 */
export const GET: RequestHandler = async () => {
	try {
		const recommendedStockLevel = getRecommendedStockLevel();

		return json({
			recommendedStockLevel
		});
	} catch (error) {
		console.error('Error getting settings:', error);
		return json({ error: 'Failed to get settings' }, { status: 500 });
	}
};

/**
 * POST endpoint handler for updating application settings.
 * Supports updating recommended stock levels and generic settings.
 *
 * Request body:
 * - key: Setting key name (string) - required
 * - value: Setting value (string|number) - required
 *
 * Special handling for 'recommendedStockLevel' key with validation.
 *
 * @param {object} params - Request parameters
 * @param {Request} params.request - The incoming HTTP request
 * @returns {Promise<Response>} JSON response with update confirmation
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { key, value } = await request.json();

		if (key === 'recommendedStockLevel') {
			const level = parseInt(value.toString(), 10);
			if (isNaN(level) || level < 0) {
				return json({ error: 'Invalid recommended stock level' }, { status: 400 });
			}

			setRecommendedStockLevel(level);

			return json({
				success: true,
				recommendedStockLevel: level
			});
		} else {
			// Generic setting update
			setSetting(key, value.toString());

			return json({
				success: true,
				key,
				value: value.toString()
			});
		}
	} catch (error) {
		console.error('Error updating setting:', error);
		return json({ error: 'Failed to update setting' }, { status: 500 });
	}
};
