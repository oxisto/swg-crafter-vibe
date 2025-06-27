import { error } from '@sveltejs/kit';
import { logger } from '$lib/logger.js';
import type { PageServerLoad } from './$types';
import type { Schematic } from '$lib/types';
import type { GetSchematicResponse } from '$lib/types/api.js';

const pageLogger = logger.child({ component: 'page', page: 'schematic-detail' });

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`/api/schematics/${params.id}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Schematic not found');
			}
			throw error(response.status, 'Failed to load schematic');
		}

		const schematic: GetSchematicResponse = await response.json();

		return {
			schematic
		};
	} catch (err) {
		pageLogger.error('Error loading schematic page data', {
			schematicId: params.id,
			error: err as Error
		});
		throw error(500, 'Failed to load schematic data');
	}
};
