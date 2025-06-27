/**
 * @fileoverview Schematics API server for the SWG Shipwright application.
 * Provides REST endpoints for retrieving schematic data from the SWGAide database.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { getAllSchematics, getSchematicsByCategory, getSchematicById } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { GetSchematicsResponse, GetSchematicResponse } from '$lib/types/api.js';
import type { RequestHandler } from './$types.js';

const schematicsLogger = logger.child({ component: 'api', endpoint: 'schematics' });

/**
 * GET endpoint handler for retrieving schematic data.
 * Supports three query modes: by ID, by category, or all schematics.
 *
 * Query parameters:
 * - id: Specific schematic ID to retrieve (string)
 * - category: Filter schematics by category (string)
 * - (no params): Return all available schematics
 *
 * @param {object} params - Request parameters
 * @param {URL} params.url - Request URL containing query parameters
 * @returns {Promise<Response>} JSON response with schematic data or error message
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	const category = url.searchParams.get('category');
	const id = url.searchParams.get('id');

	try {
		if (id) {
			const schematic = getSchematicById(id);
			if (!schematic) {
				return logAndError('Schematic not found', { id }, schematicsLogger, HttpStatus.NOT_FOUND);
			}

			return logAndSuccess(
				schematic satisfies GetSchematicResponse,
				'Successfully fetched schematic',
				{ id },
				schematicsLogger
			);
		} else if (category) {
			const schematics = getSchematicsByCategory(category);

			return logAndSuccess(
				{ schematics } satisfies GetSchematicsResponse,
				'Successfully fetched schematics by category',
				{ category, count: schematics.length },
				schematicsLogger
			);
		} else {
			const schematics = getAllSchematics();

			return logAndSuccess(
				{ schematics } satisfies GetSchematicsResponse,
				'Successfully fetched all schematics',
				{ count: schematics.length },
				schematicsLogger
			);
		}
	} catch (err) {
		return logAndError(
			'Error fetching schematics',
			{ error: err as Error, category, id },
			schematicsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
