/**
 * Resource detail page server load function
 */
import * as db from '$lib/database';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;

	if (!id) {
		throw error(404, 'Resource not found');
	}

	const resource = db.getResourceById(id);

	if (!resource) {
		throw error(404, 'Resource not found');
	}

	// Get related resources of the same class for comparison
	const relatedResources = db.getResourcesByClass(resource.className);

	return {
		resource,
		relatedResources: relatedResources
			.filter((r) => r.id !== resource.id)
			.sort((a, b) => {
				// Sort by overall quality descending
				const qualityA = a.stats?.overallQuality || 0;
				const qualityB = b.stats?.overallQuality || 0;
				return qualityB - qualityA;
			})
			.slice(0, 5) // Limit to top 5 related resources
	};
};
