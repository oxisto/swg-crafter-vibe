/**
 * @fileoverview Recent Inventory Activity API for the SWG Shipwright application.
 * Provides endpoints for retrieving recently updated inventory items and activity history.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { json } from '@sveltejs/kit';
import { getRecentlyUpdatedInventory, getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, type MarkLevel } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

/**
 * GET endpoint handler for retrieving recently updated inventory items.
 *
 * Query parameters:
 * - limit: Maximum number of items to return (default: 10, max: 50)
 * - includeSchematic: Include schematic data in response (boolean)
 * - days: Number of days to look back (default: 7, max: 30)
 *
 * @param {object} params - Request parameters
 * @param {URL} params.url - Request URL containing query parameters
 * @returns {Promise<Response>} JSON response with recent inventory updates
 */
export const GET: RequestHandler = async ({ url }) => {
	const limitParam = url.searchParams.get('limit');
	const includeSchematic = url.searchParams.get('includeSchematic') === 'true';
	const daysParam = url.searchParams.get('days');

	// Validate and set limits
	const limit = Math.min(parseInt(limitParam || '10', 10), 50);
	const days = Math.min(parseInt(daysParam || '7', 10), 30);

	try {
		const recentItems = getRecentlyUpdatedInventory(limit);

		if (includeSchematic) {
			const enrichedItems = recentItems.map((item) => {
				const key = `${item.category}-${item.markLevel}`;
				const schematicId = SCHEMATIC_ID_MAP[key];

				let schematic = null;
				let displayName = `Mark ${item.markLevel} ${item.category}`;

				if (schematicId) {
					schematic = getSchematicById(schematicId);
					if (schematic) {
						displayName = schematic.name;
						// For blasters, use custom naming
						if (item.category.startsWith('Blaster')) {
							const color = item.category.includes('Green') ? 'Green' : 'Red';
							displayName = getBlasterName(item.markLevel as MarkLevel, color as 'Green' | 'Red');
						}
					}
				}

				return {
					...item,
					displayName,
					schematic: schematic
						? {
								id: schematic.id,
								name: schematic.name,
								category: schematic.category,
								profession: schematic.profession,
								complexity: schematic.complexity,
								datapad: schematic.datapad
							}
						: null,
					schematicId
				};
			});

			return json({
				recentUpdates: enrichedItems,
				meta: {
					limit,
					days,
					totalReturned: enrichedItems.length
				}
			});
		}

		return json({
			recentUpdates: recentItems,
			meta: {
				limit,
				days,
				totalReturned: recentItems.length
			}
		});
	} catch (error) {
		console.error('Error fetching recent inventory updates:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
