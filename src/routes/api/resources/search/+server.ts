/**
 * Resource search API endpoint with transparent SOAP integration
 */
import { searchResources, getAllResourceInventory, getResourceInfoByName } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { GetResourcesResponse } from '$lib/types/api.js';
import type { ResourceInventoryItem } from '$lib/types/resources.js';
import type { RequestHandler } from './$types.js';

const searchLogger = logger.child({ component: 'api', endpoint: 'resources/search' });

// Simple in-memory cache for SOAP search queries to avoid repeated requests
interface SOAPSearchCacheEntry {
	searchTerm: string;
	timestamp: number;
	attempted: boolean;
}

const soapSearchCache = new Map<string, SOAPSearchCacheEntry>();
const SOAP_SEARCH_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function shouldPerformSOAPSearch(searchTerm: string, localResultCount: number): boolean {
	// Only do SOAP search if we have few local results and term is long enough
	if (!searchTerm || searchTerm.length < 3 || localResultCount >= 5) return false;

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
		searchLogger.info(`Performing SOAP search for: ${searchTerm}`);

		// This will automatically create the resource in the database if found
		const soapResource = await getResourceInfoByName(searchTerm);

		// Cache the attempt to avoid repeated requests
		soapSearchCache.set(cacheKey, {
			searchTerm,
			timestamp: Date.now(),
			attempted: true
		});

		if (soapResource) {
			searchLogger.info(`SOAP search found and added resource: ${soapResource.Name}`);
		} else {
			searchLogger.debug(`SOAP search found no results for: ${searchTerm}`);
		}
	} catch (error) {
		const errorMsg = (error as Error).message;
		searchLogger.warn(`SOAP search failed for "${searchTerm}": ${errorMsg}`);

		// Cache the failure to avoid repeated requests
		soapSearchCache.set(cacheKey, {
			searchTerm,
			timestamp: Date.now(),
			attempted: true
		});
	}
}

/**
 * GET /api/resources/search
 * Search for resources with transparent SOAP integration
 * If few local results are found, attempts to find resources via SOAP API
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		const searchTerm = url.searchParams.get('q') || url.searchParams.get('search') || '';

		if (!searchTerm.trim()) {
			return logAndError(
				'Search term is required',
				{ providedTerm: searchTerm },
				searchLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// First, search local database
		let resources = searchResources(searchTerm);
		const localResultCount = resources.length;

		// If we have few results and should try SOAP, do it
		if (shouldPerformSOAPSearch(searchTerm, localResultCount)) {
			await performSOAPSearch(searchTerm);

			// Re-search after potentially adding new resources from SOAP
			resources = searchResources(searchTerm);
		}

		// Get inventory for the found resources
		const inventory = getAllResourceInventory();
		const inventoryMap = new Map(
			inventory.map((item: ResourceInventoryItem) => [item.resourceId, item])
		);

		// Enrich resources with inventory data
		const resourcesWithInventory = resources.map((resource) => ({
			...resource,
			inventory: inventoryMap.get(resource.id) || null
		}));

		const response: GetResourcesResponse = {
			resources: resourcesWithInventory,
			total: resourcesWithInventory.length,
			filters: { searchTerm }
		};

		return logAndSuccess(
			response,
			'Resource search completed',
			{
				searchTerm,
				localResults: localResultCount,
				finalResults: resourcesWithInventory.length,
				soapSearchAttempted: localResultCount < 5 && searchTerm.length >= 3
			},
			searchLogger
		);
	} catch (err) {
		return logAndError(
			'Error searching resources',
			{ error: err as Error },
			searchLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
