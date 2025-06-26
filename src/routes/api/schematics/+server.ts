/**
 * @fileoverview Schematics API server for the SWG Shipwright application.
 * Provides REST endpoints for retrieving schematic data from the SWGAide database.
 *
 * Supports querying schematics by ID, category, or retrieving all available schematics.
 * Data is sourced from the cached SWGAide schematics database.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/api/schematics/+server.ts
import { json } from '@sveltejs/kit';
import { getAllSchematics, getSchematicsByCategory, getSchematicById } from '$lib/data';
import type { RequestHandler } from './$types.js';

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
export const GET: RequestHandler = async ({ url, locals }) => {
	const apiLogger = locals.logger?.child({ component: 'api', endpoint: 'schematics' }) || console;
	const category = url.searchParams.get('category');
	const id = url.searchParams.get('id');

	try {
		if (id) {
			const schematic = getSchematicById(id);
			if (!schematic) {
				apiLogger.warn(`Schematic not found: ${id}`);
				return new Response('Schematic not found', { status: 404 });
			}
			return json(schematic);
		} else if (category) {
			const schematics = getSchematicsByCategory(category);
			return json(schematics);
		} else {
			const schematics = getAllSchematics();
			return json(schematics);
		}
	} catch (error) {
		apiLogger.error(`Schematics API error: ${(error as Error).message}`);
		return new Response('Internal server error', { status: 500 });
	}
};
