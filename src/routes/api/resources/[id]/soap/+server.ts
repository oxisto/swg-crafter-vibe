/**
 * SOAP API endpoint for detailed resource information
 * Fetches real-time resource data from SWGAide using SOAP API
 * Updates resources table directly with last update tracking
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/data';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/[id]/soap
 * Fetch detailed resource information using SOAP API with smart caching
 * Only updates if resource is currently spawned and hasn't been updated in the last hour
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const rawId = params.id;
	const forceUpdate = url.searchParams.get('force') === 'true';

	if (!rawId) {
		return json(
			{
				success: false,
				error: 'Resource ID is required'
			},
			{ status: 400 }
		);
	}

	// Parse ID as integer
	const resourceId = parseInt(rawId, 10);
	if (isNaN(resourceId) || resourceId <= 0) {
		return json(
			{
				success: false,
				error: 'Invalid resource ID'
			},
			{ status: 400 }
		);
	}

	try {
		// Get the local resource first
		const localResource = db.getResourceById(resourceId);

		if (!localResource) {
			return json(
				{
					success: false,
					error: 'Resource not found'
				},
				{ status: 404 }
			);
		}

		// Check if we should update from SOAP
		let shouldUpdate = forceUpdate;
		if (!shouldUpdate && localResource.isCurrentlySpawned) {
			// Check if update is needed (>1 hour since last update or never updated)
			if (!localResource.soapLastUpdated) {
				shouldUpdate = true;
			} else {
				const lastUpdateTime = new Date(localResource.soapLastUpdated);
				const now = new Date();
				const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
				shouldUpdate = hoursSinceUpdate >= 1;
			}
		}

		let soapData = null;
		let updated = false;

		if (shouldUpdate) {
			// Fetch fresh SOAP data
			soapData = await db.getResourceInfoById(resourceId);
			updated = !!soapData;
		}

		// Get the updated resource data
		const updatedResource = db.getResourceById(resourceId);

		return json({
			success: true,
			resourceId,
			localResource: updatedResource,
			soapData,
			updated,
			reason: shouldUpdate
				? localResource.isCurrentlySpawned
					? 'Update needed'
					: 'Resource despawned'
				: 'Recently updated',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('SOAP API request failed:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch resource data from SOAP API'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST /api/resources/[id]/soap
 * Force refresh resource data from SOAP API (bypasses time-based caching)
 */
export const POST: RequestHandler = async ({ params }) => {
	const rawId = params.id;

	if (!rawId) {
		return json(
			{
				success: false,
				error: 'Resource ID is required'
			},
			{ status: 400 }
		);
	}

	// Parse ID as integer
	const resourceId = parseInt(rawId, 10);
	if (isNaN(resourceId) || resourceId <= 0) {
		return json(
			{
				success: false,
				error: 'Invalid resource ID'
			},
			{ status: 400 }
		);
	}

	try {
		// Use the new updateResourceSOAPData function
		const result = await db.updateResourceSOAPData(resourceId);

		if (!result.success) {
			return json(
				{
					success: false,
					error: result.reason || 'Failed to update resource'
				},
				{ status: result.reason === 'Resource not found' ? 404 : 500 }
			);
		}

		// Get the updated resource data
		const updatedResource = db.getResourceById(resourceId);

		return json({
			success: true,
			resourceId,
			localResource: updatedResource,
			soapData: result.resourceInfo,
			updated: result.updated,
			reason: result.reason,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Failed to refresh SOAP data:', error);
		return json(
			{
				success: false,
				error: 'Failed to refresh resource data'
			},
			{ status: 500 }
		);
	}
};
