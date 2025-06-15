/**
 * Resource API endpoint for retrieving a specific resource by ID
 * Supports optional SOAP data enrichment for detailed resource attributes
 */
import { json, error } from '@sveltejs/kit';
import * as db from '$lib/database';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types';

const apiLogger = logger.child({ component: 'api', endpoint: 'resources' });

/**
 * GET /api/resources/[id]
 * Returns a specific resource by ID with automatic SOAP data enrichment
 * Performs database updates directly when SOAP data is fetched
 * Query parameters:
 * - force=true: Force refresh SOAP data (bypasses cache)
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const rawId = params.id;
	const forceUpdate = url.searchParams.get('force') === 'true';

	if (!rawId) {
		throw error(400, 'Resource ID is required');
	}

	// Parse ID as integer
	const id = parseInt(rawId, 10);
	if (isNaN(id) || id <= 0) {
		throw error(400, 'Invalid resource ID');
	}

	const resource = db.getResourceById(id);

	if (!resource) {
		throw error(404, 'Resource not found');
	}

	let soapResult = null;

	// Always attempt SOAP data enrichment with smart caching
	try {
		if (forceUpdate) {
			// Force update bypasses all caching logic
			const soapData = await db.getResourceInfoById(id);
			soapResult = {
				data: soapData,
				updated: !!soapData,
				reason: soapData ? 'Force updated from SOAP' : 'Force update failed',
				timestamp: new Date().toISOString()
			};
		} else {
			// Use the smart update logic from updateResourceSOAPData
			const updateResult = await db.updateResourceSOAPData(id);
			soapResult = {
				data: updateResult.resourceInfo || null,
				updated: updateResult.updated,
				reason: updateResult.reason || 'Unknown',
				timestamp: new Date().toISOString()
			};
		}
	} catch (error) {
		apiLogger.error('SOAP API request failed', { error: error as Error, resourceId: id });
		soapResult = {
			data: null,
			updated: false,
			reason: 'SOAP request failed',
			timestamp: new Date().toISOString()
		};
	}

	// Get the potentially updated resource data
	const updatedResource = soapResult.updated ? db.getResourceById(id) : resource;

	return json({
		success: true,
		resource: updatedResource,
		soap: soapResult
	});
};
