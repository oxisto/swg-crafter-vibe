/**
 * Resource API endpoint for retrieving a specific resource by ID
 * Includes transparent SOAP data enrichment for active resources only
 */
import * as db from '$lib/data';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { GetResourceResponse } from '$lib/types/api.js';
import type { RequestHandler } from './$types';

const resourceLogger = logger.child({ component: 'api', endpoint: 'resources/[id]' });

/**
 * GET /api/resources/[id]
 * Returns a specific resource by ID with transparent SOAP data enrichment
 * Only attempts SOAP updates for currently spawned resources
 * Query parameters:
 * - force=true: Force refresh SOAP data (bypasses cache and despawn check)
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const rawId = params.id;
	const forceUpdate = url.searchParams.get('force') === 'true';

	if (!rawId) {
		return logAndError('Resource ID is required', {}, resourceLogger, HttpStatus.BAD_REQUEST);
	}

	// Parse ID as integer
	const id = parseInt(rawId, 10);
	if (isNaN(id) || id <= 0) {
		return logAndError('Invalid resource ID', {}, resourceLogger, HttpStatus.BAD_REQUEST);
	}

	const resource = db.getResourceById(id);

	if (!resource) {
		return logAndError('Resource not found', {}, resourceLogger, HttpStatus.NOT_FOUND);
	}

	// Only attempt SOAP data enrichment for spawned resources (unless forced)
	const shouldUpdateSOAP = forceUpdate || resource.isCurrentlySpawned;

	if (shouldUpdateSOAP) {
		try {
			if (forceUpdate) {
				// Force update bypasses all caching and despawn logic
				resourceLogger.info(`Force updating SOAP data for resource ${id}`);
				await db.getResourceInfoById(id);
			} else {
				// Use the smart update logic (respects caching and despawn status)
				await db.updateResourceSOAPData(id);
			}
		} catch (error) {
			resourceLogger.warn(`SOAP update failed for resource ${id}`, { error: error as Error });
			// Continue with existing data - SOAP failure shouldn't break the response
		}
	}

	// Get the potentially updated resource data
	const finalResource = db.getResourceById(id) || resource;

	// Get inventory for this resource
	const inventory = db.getResourceInventoryByResourceId(id);

	const response: GetResourceResponse = {
		...finalResource,
		inventory: inventory || null
	};

	return logAndSuccess(
		response,
		'Resource retrieved successfully',
		{
			resourceId: id,
			soapUpdateAttempted: shouldUpdateSOAP,
			isSpawned: resource.isCurrentlySpawned,
			forced: forceUpdate
		},
		resourceLogger
	);
};
