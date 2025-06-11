/**
 * Resource details API endpoint using SOAP
 * Fetches detailed resource information from SWGAide SOAP API
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/database';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/details/[identifier]
 * Fetch detailed resource information by name or ID
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const identifier = params.identifier;
	const byId = url.searchParams.get('by') === 'id';

	if (!identifier) {
		return json(
			{
				success: false,
				error: 'Resource identifier is required'
			},
			{ status: 400 }
		);
	}

	try {
		let resourceInfo;

		if (byId) {
			resourceInfo = await db.getResourceInfoById(identifier);
		} else {
			resourceInfo = await db.getResourceInfoByName(identifier);
		}

		if (!resourceInfo) {
			return json(
				{
					success: false,
					error: 'Resource not found'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			identifier,
			method: byId ? 'by_id' : 'by_name',
			resourceInfo,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Failed to fetch resource details:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch resource details'
			},
			{ status: 500 }
		);
	}
};
