/**
 * Resource API endpoint for retrieving a specific resource by ID
 * Supports optional SOAP data enrichment for detailed resource attributes
 */
import * as db from '$lib/data';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/[id]
 * Returns a specific resource by ID with automatic SOAP data enrichment
 * Performs database updates directly when SOAP data is fetched
 * Query parameters:
 * - force=true: Force refresh SOAP data (bypasses cache)
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const rawId = params.id;
	const forceUpdate = url.searchParams.get('force') === 'true';

	if (!rawId) {
		return logAndError('Resource ID is required', {}, locals.logger, HttpStatus.BAD_REQUEST);
	}

	// Parse ID as integer
	const id = parseInt(rawId, 10);
	if (isNaN(id) || id <= 0) {
		return logAndError('Invalid resource ID', {}, locals.logger, HttpStatus.BAD_REQUEST);
	}

	const resource = db.getResourceById(id);

	if (!resource) {
		return logAndError('Resource not found', {}, locals.logger, HttpStatus.NOT_FOUND);
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
		locals.logger?.error('SOAP API request failed', { error: error as Error, resourceId: id });
		soapResult = {
			data: null,
			updated: false,
			reason: 'SOAP request failed',
			timestamp: new Date().toISOString()
		};
	}

	// Get the potentially updated resource data
	const updatedResource = soapResult.updated ? db.getResourceById(id) : resource;

	return logAndSuccess(
		{
			resource: updatedResource,
			soap: soapResult
		},
		'Resource retrieved successfully',
		{},
		locals.logger
	);
};
