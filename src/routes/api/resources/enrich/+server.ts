/**
 * Resource enrichment API endpoint
 * Fetches additional details and updates local database
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/database';
import type { RequestHandler } from './$types';

/**
 * POST /api/resources/enrich
 * Fetch and store additional resource details
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { resourceName } = await request.json();

		if (!resourceName) {
			return json(
				{
					success: false,
					error: 'Resource name is required'
				},
				{ status: 400 }
			);
		}

		const success = await db.enrichResourceData(resourceName);

		if (success) {
			return json({
				success: true,
				message: 'Resource data enriched successfully',
				resourceName
			});
		} else {
			return json(
				{
					success: false,
					error: 'Failed to enrich resource data'
				},
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error('Resource enrichment failed:', error);
		return json(
			{
				success: false,
				error: 'Resource enrichment failed'
			},
			{ status: 500 }
		);
	}
};
