/**
 * Resources API endpoints for retrieving SWG resource data
 * Includes transparent SOAP integration for better search results
 */
import { getAllResources, getAllResourceInventory, getResourceInfoByName } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { GetResourcesResponse } from '$lib/types/api.js';
import type { ResourceInventoryItem } from '$lib/types/resources.js';
import type { RequestHandler } from './$types.js';

const resourcesLogger = logger.child({ component: 'api', endpoint: 'resources' });

// Simple in-memory cache for SOAP search queries to avoid repeated requests
interface SOAPSearchCacheEntry {
	searchTerm: string;
	timestamp: number;
	attempted: boolean;
}

const soapSearchCache = new Map<string, SOAPSearchCacheEntry>();
const SOAP_SEARCH_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function shouldPerformSOAPSearch(searchTerm: string): boolean {
	if (!searchTerm || searchTerm.length < 3) return false;

	const cacheKey = searchTerm.toLowerCase();
	const cachedEntry = soapSearchCache.get(cacheKey);

	// If we recently attempted this search, don't try again
	if (cachedEntry && Date.now() - cachedEntry.timestamp < SOAP_SEARCH_CACHE_DURATION) {
		return false;
	}

	return true;
}

async function performSOAPSearch(searchTerm: string): Promise<void> {
	const cacheKey = searchTerm.toLowerCase();

	try {
		resourcesLogger.info(`Performing SOAP search for: ${searchTerm}`);

		// This will automatically create the resource in the database if found
		const soapResource = await getResourceInfoByName(searchTerm);

		// Cache the attempt to avoid repeated requests
		soapSearchCache.set(cacheKey, {
			searchTerm,
			timestamp: Date.now(),
			attempted: true
		});

		if (soapResource) {
			resourcesLogger.info(`SOAP search found and added resource: ${soapResource.Name}`);
		} else {
			resourcesLogger.debug(`SOAP search found no results for: ${searchTerm}`);
		}
	} catch (error) {
		const errorMsg = (error as Error).message;
		resourcesLogger.warn(`SOAP search failed for "${searchTerm}": ${errorMsg}`);

		// Cache the failure to avoid repeated requests
		soapSearchCache.set(cacheKey, {
			searchTerm,
			timestamp: Date.now(),
			attempted: true
		});
	}
}

/**
 * GET /api/resources
 * Returns available resources with optional filtering and pagination
 * Includes transparent SOAP integration for better search results
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		const className = url.searchParams.get('class') || undefined;
		const searchTerm = url.searchParams.get('search') || undefined;
		const spawnStatus = url.searchParams.get('status') || undefined;

		// Pagination parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = (page - 1) * limit;

		// SOAP fallback search for better results - happens BEFORE filtering
		// This ensures new resources get into the database before we query
		if (searchTerm && shouldPerformSOAPSearch(searchTerm)) {
			await performSOAPSearch(searchTerm);
		}

		// Get all resources from database (including any newly added from SOAP)
		let resources = getAllResources();

		// Apply spawn status filter first (most selective)
		if (spawnStatus === 'active') {
			resources = resources.filter((resource) => resource.isCurrentlySpawned);
		} else if (spawnStatus === 'despawned') {
			resources = resources.filter((resource) => !resource.isCurrentlySpawned);
		}

		// Apply class filter if provided
		if (className) {
			resources = resources.filter(
				(resource) =>
					resource.className.toLowerCase().includes(className.toLowerCase()) ||
					(resource.classPath &&
						resource.classPath.some((path) => path.toLowerCase().includes(className.toLowerCase())))
			);
		}

		// Apply search filter if provided
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			resources = resources.filter(
				(resource) =>
					resource.name.toLowerCase().includes(searchLower) ||
					resource.className.toLowerCase().includes(searchLower) ||
					resource.type.toLowerCase().includes(searchLower)
			);
		}

		// Get total count before pagination
		const totalResources = resources.length;

		// Apply pagination
		const paginatedResources = resources.slice(offset, offset + limit);

		// Get inventory for the paginated resources
		const inventory = getAllResourceInventory();
		const inventoryMap = new Map(
			inventory.map((item: ResourceInventoryItem) => [item.resourceId, item])
		);

		// Enrich the paginated resources with inventory data
		const resourcesWithInventory = paginatedResources.map((resource) => ({
			...resource,
			inventory: inventoryMap.get(resource.id) || null
		}));

		const response: GetResourcesResponse = {
			resources: resourcesWithInventory,
			total: totalResources,
			page,
			limit,
			totalPages: Math.ceil(totalResources / limit),
			filters: { className, searchTerm, spawnStatus }
		};

		return logAndSuccess(
			response,
			'Successfully fetched resources',
			{
				total: totalResources,
				returned: resourcesWithInventory.length,
				page,
				limit,
				totalPages: response.totalPages,
				filtersApplied: !!(className || searchTerm || spawnStatus)
			},
			resourcesLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching resources',
			{ error: err as Error },
			resourcesLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
