/**
 * Resources API endpoints for retrieving SWG resource data
 */
import { getAllResources, getAllResourceInventory } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { GetResourcesResponse } from '$lib/types/api.js';
import type { ResourceInventoryItem } from '$lib/types/resources.js';
import type { RequestHandler } from './$types.js';

const resourcesLogger = logger.child({ component: 'api', endpoint: 'resources' });

/**
 * GET /api/resources
 * Returns available resources with optional filtering and pagination
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

		// Only get inventory for the paginated resources (much more efficient)
		const inventory = getAllResourceInventory();
		const inventoryMap = new Map(
			inventory.map((item: ResourceInventoryItem) => [item.resourceId, item])
		);

		// Enrich only the paginated resources with inventory data
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
				filtersApplied: !!(className || searchTerm || spawnStatus),
				className: !!className,
				searchTerm: !!searchTerm,
				spawnStatus: !!spawnStatus
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
