/**
 * Resources API endpoints for retrieving SWG resource data
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/data';
import { createSuccessResponse, createErrorResponse, HttpStatus } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types.js';

const resourcesLogger = logger.child({ component: 'api', endpoint: 'resources' });

/**
 * GET /api/resources
 * Returns all available resources with optional filtering
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const className = url.searchParams.get('class');
		const searchTerm = url.searchParams.get('search');
		const spawnStatus = url.searchParams.get('status');

		let resources = db.getAllResources();

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

		resourcesLogger.info('Successfully fetched resources', {
			total: resources.length,
			filters: { className, searchTerm, spawnStatus }
		});

		return createSuccessResponse({
			resources,
			total: resources.length,
			filters: { className, searchTerm, spawnStatus }
		});
	} catch (error) {
		resourcesLogger.error('Error fetching resources', { error: error as Error });
		return createErrorResponse('Failed to fetch resources', HttpStatus.INTERNAL_SERVER_ERROR);
	}
};
