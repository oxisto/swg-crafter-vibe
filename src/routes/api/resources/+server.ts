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
 * Returns all available resources with optional filtering
 */
export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		const className = url.searchParams.get('class') || undefined;
		const searchTerm = url.searchParams.get('search') || undefined;
		const spawnStatus = url.searchParams.get('status') || undefined;

		let resources = getAllResources();

		// Get inventory data and create a map for quick lookup
		const inventory = getAllResourceInventory();
		const inventoryMap = new Map(inventory.map((item: ResourceInventoryItem) => [item.resourceId, item]));

		// Apply spawn status filter if provided
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

		// Enrich resources with inventory data
		const resourcesWithInventory = resources.map(resource => ({
			...resource,
			inventory: inventoryMap.get(resource.id) || null
		}));

		const response: GetResourcesResponse = {
			resources: resourcesWithInventory,
			total: resourcesWithInventory.length,
			filters: { className, searchTerm, spawnStatus }
		};

		return logAndSuccess(
			response,
			'Successfully fetched resources',
			{
				total: resourcesWithInventory.length,
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
