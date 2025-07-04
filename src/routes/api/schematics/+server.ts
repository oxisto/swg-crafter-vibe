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
 * Supports filtering by category and pagination.
 *
 * Query parameters:
 * - id: Specific schematic ID to retrieve (string)
 * - category: Filter schematics by category (string)
 * - search: Search schematics by name (string)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 50, max: 500)
 * - (no params): Return all available schematics
 *
 * @param {object} params - Request parameters
 * @param {URL} params.url - Request URL containing query parameters
 * @returns {Promise<Response>} JSON response with schematic data or error message
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	const category = url.searchParams.get('category');
	const searchTerm = url.searchParams.get('search');
	const id = url.searchParams.get('id');

	// Pagination parameters
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
	const offset = (page - 1) * limit;

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
		} else {
			// Get all schematics first
			let schematics = getAllSchematics();

			// Apply category filter if provided
			if (category) {
				schematics = schematics.filter((schematic) => {
					// Ensure category is treated as a string for comparison
					const schematicCategory = String(schematic.category || '');
					return schematicCategory.toLowerCase().includes(category.toLowerCase());
				});
			}

			// Apply search filter if provided
			if (searchTerm) {
				const search = searchTerm.toLowerCase();
				schematics = schematics.filter((schematic) => {
					// Ensure name is treated as a string for comparison
					const schematicName = String(schematic.name || '');
					return schematicName.toLowerCase().includes(search);
				});
			}

			// Sort schematics: favorites first, then alphabetically by name
			schematics.sort((a, b) => {
				// First sort by favorite status (favorites first)
				if (a.is_favorite && !b.is_favorite) return -1;
				if (!a.is_favorite && b.is_favorite) return 1;

				// Then sort alphabetically by name
				return (a.name || '').localeCompare(b.name || '');
			});

			// Get total count before pagination
			const totalSchematics = schematics.length;

			// Apply pagination
			const paginatedSchematics = schematics.slice(offset, offset + limit);

			const response: GetSchematicsResponse = {
				schematics: paginatedSchematics,
				total: totalSchematics,
				page,
				limit,
				totalPages: Math.ceil(totalSchematics / limit),
				filters: {
					category: category || undefined,
					searchTerm: searchTerm || undefined
				}
			};

			return logAndSuccess(
				response,
				'Successfully fetched schematics',
				{
					total: totalSchematics,
					returned: paginatedSchematics.length,
					page,
					limit,
					totalPages: response.totalPages,
					filtersApplied: !!(category || searchTerm)
				},
				schematicsLogger
			);
		}
	} catch (err) {
		return logAndError(
			'Error fetching schematics',
			{ error: err as Error, category, searchTerm, id },
			schematicsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
