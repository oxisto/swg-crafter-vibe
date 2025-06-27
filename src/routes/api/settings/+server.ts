/**
 * @fileoverview Settings API server for the SWG Shipwright application.
 * Provides REST endpoints for managing application settings including
 * recommended stock levels and other configuration options.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import {
	getSetting,
	setSetting,
	getRecommendedStockLevel,
	setRecommendedStockLevel,
	getSellValues,
	setSellValues
} from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { GetSettingsResponse, UpdateSettingsResponse } from '$lib/types/api.js';
import type { RequestHandler } from './$types.js';

const settingsLogger = logger.child({ component: 'api', endpoint: 'settings' });

/**
 * GET endpoint handler for retrieving application settings.
 * Returns the recommended stock level and sell values configuration.
 *
 * @returns {Promise<Response>} JSON response with current settings
 */
export const GET: RequestHandler = async (): Promise<Response> => {
	try {
		const recommendedStockLevel = getRecommendedStockLevel();
		const sellValues = getSellValues();

		const settings: GetSettingsResponse = {
			recommendedStockLevel,
			sellValues
		};

		return logAndSuccess(
			settings,
			'Successfully fetched settings',
			{ recommendedStockLevel },
			settingsLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching settings',
			{ error: err as Error },
			settingsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
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
export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const body = await request.json();

		// Handle sell values update
		if ('sellValues' in body) {
			const { sellValues } = body;

			// Validate sell values
			if (typeof sellValues !== 'object' || sellValues === null) {
				return logAndError(
					'Invalid sell values format',
					{ sellValues },
					settingsLogger,
					HttpStatus.BAD_REQUEST
				);
			}

			// Validate all values are numbers
			for (const [markLevel, value] of Object.entries(sellValues)) {
				const numValue = parseFloat(value as string);
				if (isNaN(numValue) || numValue < 0) {
					return logAndError(
						`Invalid sell value for mark level ${markLevel}`,
						{ markLevel, value },
						settingsLogger,
						HttpStatus.BAD_REQUEST
					);
				}
			}

			setSellValues(sellValues as Record<string, number>);

			const updatedSettings: UpdateSettingsResponse = {
				recommendedStockLevel: getRecommendedStockLevel(),
				sellValues
			};

			return logAndSuccess(
				updatedSettings,
				'Successfully updated sell values',
				{ sellValuesCount: Object.keys(sellValues).length },
				settingsLogger
			);
		}

		const { key, value } = body;

		if (!key) {
			return logAndError(
				'Missing required key field',
				{ body },
				settingsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		if (key === 'recommendedStockLevel') {
			const level = parseInt(value.toString(), 10);
			if (isNaN(level) || level < 0) {
				return logAndError(
					'Invalid recommended stock level',
					{ key, value, level },
					settingsLogger,
					HttpStatus.BAD_REQUEST
				);
			}

			setRecommendedStockLevel(level);

			const updatedSettings: UpdateSettingsResponse = {
				recommendedStockLevel: level,
				sellValues: getSellValues()
			};

			return logAndSuccess(
				updatedSettings,
				'Successfully updated recommended stock level',
				{ key, oldValue: getRecommendedStockLevel(), newValue: level },
				settingsLogger
			);
		} else {
			// Generic setting update
			setSetting(key, value.toString());

			const updatedSettings: UpdateSettingsResponse = {
				recommendedStockLevel: getRecommendedStockLevel(),
				sellValues: getSellValues()
			};

			return logAndSuccess(
				updatedSettings,
				'Successfully updated setting',
				{ key, value: value.toString() },
				settingsLogger
			);
		}
	} catch (err) {
		return logAndError(
			'Error updating settings',
			{ error: err as Error },
			settingsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
