import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSchematicById, getResourceDisplayName } from '$lib/data';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const schematic = getSchematicById(params.id);

		if (!schematic) {
			throw error(404, 'Schematic not found');
		}

		// Process resource classes to include display names for client use
		const processedSchematic = {
			...schematic,
			resources: schematic.resources?.map((resource) => ({
				...resource,
				classes: resource.classes?.map((cls) => {
					// Handle both string and object formats
					if (typeof cls === 'string') {
						return {
							code: cls,
							displayName: getResourceDisplayName(cls)
						};
					} else {
						// Already an object with code and displayName
						return cls;
					}
				})
			}))
		};

		return json(processedSchematic);
	} catch (err) {
		console.error('Error fetching schematic:', err);
		throw error(500, 'Failed to fetch schematic data');
	}
};
