/**
 * API endpoint for managing schematic resource loadouts
 */

import {
	getSchematicLoadouts,
	getSchematicLoadoutResources,
	createSchematicLoadout,
	assignResourceToLoadout,
	deleteSchematicLoadout,
	renameSchematicLoadout
} from '$lib/data';
import { getSchematicById } from '$lib/data/schematics.js';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import type {
	GetSchematicLoadoutsResponse,
	GetSchematicLoadoutResourcesResponse,
	CreateSchematicLoadoutResponse,
	UpdateSchematicLoadoutResponse,
	DeleteSchematicLoadoutResponse
} from '$lib/types/api.js';
import type { RequestHandler } from './$types.js';

const loadoutsLogger = logger.child({ component: 'api', endpoint: 'schematic-loadouts' });

/**
 * GET /api/schematics/[id]/loadouts
 * Retrieve all loadouts for a schematic or specific loadout resources
 */
export const GET: RequestHandler = async ({ params, url }): Promise<Response> => {
	const { id: schematicId } = params;
	const loadoutName = url.searchParams.get('loadout');

	if (!schematicId) {
		return logAndError(
			'Schematic ID is required',
			{ schematicId },
			loadoutsLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	try {
		// Verify the schematic exists
		const schematic = getSchematicById(schematicId);
		if (!schematic) {
			return logAndError(
				'Schematic not found',
				{ schematicId },
				loadoutsLogger,
				HttpStatus.NOT_FOUND
			);
		}

		if (loadoutName) {
			// Get specific loadout resources
			const resources = getSchematicLoadoutResources(schematicId, loadoutName);
			return logAndSuccess(
				resources satisfies GetSchematicLoadoutResourcesResponse,
				'Successfully fetched loadout resources',
				{ schematicId, loadoutName, resourceCount: resources.length },
				loadoutsLogger
			);
		} else {
			// Get all loadouts for the schematic
			const loadouts = getSchematicLoadouts(schematicId);
			return logAndSuccess(
				loadouts satisfies GetSchematicLoadoutsResponse,
				'Successfully fetched schematic loadouts',
				{ schematicId, loadoutCount: loadouts.length },
				loadoutsLogger
			);
		}
	} catch (error) {
		return logAndError(
			'Error fetching schematic loadouts',
			{ error: error as Error, schematicId, loadoutName },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * POST /api/schematics/[id]/loadouts
 * Create a new loadout for a schematic
 */
export const POST: RequestHandler = async ({ params, request }): Promise<Response> => {
	const { id: schematicId } = params;

	if (!schematicId) {
		return logAndError(
			'Schematic ID is required',
			{ schematicId },
			loadoutsLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	try {
		const body = await request.json();
		const { loadoutName } = body;

		if (!loadoutName || typeof loadoutName !== 'string') {
			return logAndError(
				'Loadout name is required and must be a string',
				{ schematicId, loadoutName },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Verify the schematic exists and get its resources
		const schematic = getSchematicById(schematicId);
		if (!schematic) {
			return logAndError(
				'Schematic not found',
				{ schematicId },
				loadoutsLogger,
				HttpStatus.NOT_FOUND
			);
		}

		// Extract resource slot names from the schematic
		const resourceSlots = schematic.resources.map((resource) => resource.name);

		if (resourceSlots.length === 0) {
			return logAndError(
				'Schematic has no resource requirements',
				{ schematicId },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		// Create the loadout
		createSchematicLoadout(schematicId, loadoutName, resourceSlots);

		const response: CreateSchematicLoadoutResponse = {
			success: true,
			message: `Loadout "${loadoutName}" created successfully with ${resourceSlots.length} resource slots`
		};

		return logAndSuccess(
			response,
			'Successfully created schematic loadout',
			{ schematicId, loadoutName, slotCount: resourceSlots.length },
			loadoutsLogger
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		if (errorMessage.includes('UNIQUE constraint failed')) {
			return logAndError(
				'A loadout with this name already exists for this schematic',
				{ error: error as Error, schematicId },
				loadoutsLogger,
				HttpStatus.CONFLICT
			);
		}

		return logAndError(
			'Error creating schematic loadout',
			{ error: error as Error, schematicId },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * PUT /api/schematics/[id]/loadouts
 * Update a loadout (assign resources or rename)
 */
export const PUT: RequestHandler = async ({ params, request }): Promise<Response> => {
	const { id: schematicId } = params;

	if (!schematicId) {
		return logAndError(
			'Schematic ID is required',
			{ schematicId },
			loadoutsLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	try {
		const body = await request.json();
		const { loadoutName, action, ...actionData } = body;

		if (!loadoutName || typeof loadoutName !== 'string') {
			return logAndError(
				'Loadout name is required and must be a string',
				{ schematicId, loadoutName },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		if (!action || typeof action !== 'string') {
			return logAndError(
				'Action is required and must be a string',
				{ schematicId, loadoutName, action },
				loadoutsLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		let response: UpdateSchematicLoadoutResponse;

		switch (action) {
			case 'assign': {
				const { resourceSlotName, resourceId, resourceName } = actionData;

				if (!resourceSlotName || typeof resourceSlotName !== 'string') {
					return logAndError(
						'Resource slot name is required for assign action',
						{ schematicId, loadoutName, resourceSlotName },
						loadoutsLogger,
						HttpStatus.BAD_REQUEST
					);
				}

				assignResourceToLoadout(
					schematicId,
					loadoutName,
					resourceSlotName,
					resourceId || null,
					resourceName || null
				);

				response = {
					success: true,
					message: `Resource assigned to slot "${resourceSlotName}" in loadout "${loadoutName}"`
				};
				break;
			}

			case 'rename': {
				const { newLoadoutName } = actionData;

				if (!newLoadoutName || typeof newLoadoutName !== 'string') {
					return logAndError(
						'New loadout name is required for rename action',
						{ schematicId, loadoutName, newLoadoutName },
						loadoutsLogger,
						HttpStatus.BAD_REQUEST
					);
				}

				renameSchematicLoadout(schematicId, loadoutName, newLoadoutName);

				response = {
					success: true,
					message: `Loadout renamed from "${loadoutName}" to "${newLoadoutName}"`
				};
				break;
			}

			default:
				return logAndError(
					'Invalid action. Supported actions: assign, rename',
					{ schematicId, loadoutName, action },
					loadoutsLogger,
					HttpStatus.BAD_REQUEST
				);
		}

		return logAndSuccess(
			response,
			'Successfully updated schematic loadout',
			{ schematicId, loadoutName, action },
			loadoutsLogger
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		if (errorMessage.includes('UNIQUE constraint failed')) {
			return logAndError(
				'A loadout with this name already exists for this schematic',
				{ error: error as Error, schematicId },
				loadoutsLogger,
				HttpStatus.CONFLICT
			);
		}

		if (errorMessage.includes('No loadout')) {
			return logAndError(
				'Loadout not found',
				{ error: error as Error, schematicId },
				loadoutsLogger,
				HttpStatus.NOT_FOUND
			);
		}

		return logAndError(
			'Error updating schematic loadout',
			{ error: error as Error, schematicId },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * DELETE /api/schematics/[id]/loadouts?loadout=name
 * Delete a loadout
 */
export const DELETE: RequestHandler = async ({ params, url }): Promise<Response> => {
	const { id: schematicId } = params;
	const loadoutName = url.searchParams.get('loadout');

	if (!schematicId) {
		return logAndError(
			'Schematic ID is required',
			{ schematicId },
			loadoutsLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	if (!loadoutName) {
		return logAndError(
			'Loadout name is required',
			{ schematicId, loadoutName },
			loadoutsLogger,
			HttpStatus.BAD_REQUEST
		);
	}

	try {
		deleteSchematicLoadout(schematicId, loadoutName);

		const response: DeleteSchematicLoadoutResponse = {
			success: true,
			message: `Loadout "${loadoutName}" deleted successfully`
		};

		return logAndSuccess(
			response,
			'Successfully deleted schematic loadout',
			{ schematicId, loadoutName },
			loadoutsLogger
		);
	} catch (error) {
		return logAndError(
			'Error deleting schematic loadout',
			{ error: error as Error, schematicId, loadoutName },
			loadoutsLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
