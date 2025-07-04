import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '$lib/data/database.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type { ResourceClass, GetResourceTreeResponse } from '$lib/types/api.js';

/**
 * Get the complete resource tree hierarchy
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const db = getDatabase();
		const format = url.searchParams.get('format') || 'tree'; // 'tree' or 'flat'

		// Get all resource classes
		const resourceClasses = db
			.prepare(
				`
			SELECT 
				id, swgcraft_id, swgID, name, parent_id, depth, harvested, recycled
			FROM resource_classes 
			ORDER BY depth, name
		`
			)
			.all() as ResourceClass[];

		if (format === 'flat') {
			return logAndSuccess<GetResourceTreeResponse>(
				{
					tree: [],
					flat: resourceClasses
				},
				'Retrieved resource classes'
			);
		}

		// Build hierarchical tree
		const resourceMap = new Map<string, ResourceClass>();
		const rootNodes: ResourceClass[] = [];

		// First pass: create map and initialize children arrays
		for (const resourceClass of resourceClasses) {
			resourceClass.children = [];
			resourceMap.set(resourceClass.swgcraft_id, resourceClass);
		}

		// Second pass: build hierarchy
		for (const resourceClass of resourceClasses) {
			if (resourceClass.parent_id === null || resourceClass.parent_id === '') {
				rootNodes.push(resourceClass);
			} else {
				const parent = resourceMap.get(resourceClass.parent_id);
				if (parent) {
					parent.children!.push(resourceClass);
				} else {
					// Orphaned node, add to root
					console.warn(
						`Orphaned resource class: ${resourceClass.name} (parent_id: ${resourceClass.parent_id})`
					);
					rootNodes.push(resourceClass);
				}
			}
		}

		return logAndSuccess<GetResourceTreeResponse>(
			{
				tree: rootNodes,
				flat: resourceClasses
			},
			'Retrieved resource tree'
		);
	} catch (error) {
		console.error('Error fetching resource tree:', error);
		return logAndError('Failed to fetch resource tree');
	}
};
