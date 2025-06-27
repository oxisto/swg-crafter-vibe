import { error } from '@sveltejs/kit';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types';
import { getSchematicById, getResourceDisplayName } from '$lib/data';

const schematicsLogger = logger.child({ component: 'api', endpoint: 'schematics' });

export const GET: RequestHandler = async ({ params, locals }) => {
	const apiLogger =
		locals?.logger?.child({ component: 'api', endpoint: 'schematics' }) || schematicsLogger;

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

		return logAndSuccess(
			processedSchematic,
			`Retrieved schematic: ${schematic.name}`,
			{ schematicId: params.id },
			apiLogger
		);
	} catch (err) {
		if (err instanceof Error && err.message === 'Schematic not found') {
			throw err; // Re-throw SvelteKit errors
		}
		return logAndError(
			`Error fetching schematic: ${(err as Error).message}`,
			{ schematicId: params.id, error: err as Error },
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
