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
	setRecommendedStockLevel,
	getSellValues,
	setSellValues
} from '$lib/data';
import { createSuccessResponse, createErrorResponse, HttpStatus } from '$lib/api/utils.js';
import type { RequestHandler } from './$types.js';

/**
 * GET endpoint handler for retrieving application settings.
 * Returns the recommended stock level and sell values configuration.
 *
 * @returns {Promise<Response>} JSON response with current settings
 */
export const GET: RequestHandler = async () => {
	try {
		const recommendedStockLevel = getRecommendedStockLevel();
		const sellValues = getSellValues();

		return createSuccessResponse({
			recommendedStockLevel,
			sellValues
		});
	} catch (error) {
		console.error('Error getting settings:', error);
		return createErrorResponse(
			'Failed to get settings',
			HttpStatus.INTERNAL_SERVER_ERROR,
			error as Error
		);
	}
};

/**
 * POST endpoint handler for updating application settings.
 * Supports updating recommended stock levels, sell values, and generic settings.
 *
 * Request body:
 * - key: Setting key name (string) - required
 * - value: Setting value (string|number) - required
 * OR
 * - sellValues: Object mapping mark levels to sell values
 *
 * Special handling for 'recommendedStockLevel' key and 'sellValues' object.
 *
 * @param {object} params - Request parameters
 * @param {Request} params.request - The incoming HTTP request
 * @returns {Promise<Response>} JSON response with update confirmation
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Handle sell values update
		if ('sellValues' in body) {
			const { sellValues } = body;

			// Validate sell values
			if (typeof sellValues !== 'object' || sellValues === null) {
				return createErrorResponse('Invalid sell values format', HttpStatus.BAD_REQUEST);
			}

			// Validate all values are numbers
			for (const [markLevel, value] of Object.entries(sellValues)) {
				const numValue = parseFloat(value as string);
				if (isNaN(numValue) || numValue < 0) {
					return createErrorResponse(
						`Invalid sell value for mark level ${markLevel}`,
						HttpStatus.BAD_REQUEST
					);
				}
			}

			setSellValues(sellValues as Record<string, number>);

			return createSuccessResponse({
				sellValues
			});
		}

		const { key, value } = body;

		if (key === 'recommendedStockLevel') {
			const level = parseInt(value.toString(), 10);
			if (isNaN(level) || level < 0) {
				return createErrorResponse('Invalid recommended stock level', HttpStatus.BAD_REQUEST);
			}

			setRecommendedStockLevel(level);

			return createSuccessResponse({
				recommendedStockLevel: level
			});
		} else {
			// Generic setting update
			setSetting(key, value.toString());

			return createSuccessResponse({
				key,
				value: value.toString()
			});
		}
	} catch (error) {
		console.error('Error updating setting:', error);
		return createErrorResponse(
			'Failed to update setting',
			HttpStatus.INTERNAL_SERVER_ERROR,
			(error as Error).message
		);
	}
};
