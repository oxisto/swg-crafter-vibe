/**
 * Resource Inventory Management API
 * Handle inventory operations for specific resources
 */

import { setResourceInventory, removeResourceInventory } from '$lib/data';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { RESOURCE_INVENTORY_AMOUNTS } from '$lib/types/resource-inventory.js';
import type { ResourceInventoryAmount } from '$lib/types/resources.js';
import type { RequestHandler } from './$types.js';

const inventoryLogger = logger.child({ component: 'api', endpoint: 'resource-inventory' });

/**
 * PUT /api/resources/[id]/inventory
 * Update or create inventory for a specific resource
 */
export const PUT: RequestHandler = async ({ params, request }): Promise<Response> => {
	try {
		const resourceId = parseInt(params.id);

		if (isNaN(resourceId)) {
			return logAndError(
				'Invalid resource ID',
				new Error('Resource ID must be a valid number'),
				inventoryLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		const body = await request.json();

		if (!body.amount || !Object.keys(RESOURCE_INVENTORY_AMOUNTS).includes(body.amount)) {
			return logAndError(
				'Invalid amount value',
				new Error(`Amount must be one of: ${Object.keys(RESOURCE_INVENTORY_AMOUNTS).join(', ')}`),
				inventoryLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		const inventoryItem = setResourceInventory(
			resourceId,
			body.amount as ResourceInventoryAmount,
			body.notes
		);

		return logAndSuccess(
			{ inventory: inventoryItem },
			`Successfully updated inventory for resource ${resourceId}`,
			{ resourceId, amount: body.amount },
			inventoryLogger
		);
	} catch (err) {
		return logAndError(
			'Error updating resource inventory',
			{ error: err as Error },
			inventoryLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

/**
 * DELETE /api/resources/[id]/inventory  
 * Remove inventory tracking for a specific resource
 */
export const DELETE: RequestHandler = async ({ params }): Promise<Response> => {
	try {
		const resourceId = parseInt(params.id);

		if (isNaN(resourceId)) {
			return logAndError(
				'Invalid resource ID',
				new Error('Resource ID must be a valid number'),
				inventoryLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		const success = removeResourceInventory(resourceId);

		if (!success) {
			return logAndError(
				'Resource inventory not found',
				new Error(`No inventory found for resource ${resourceId}`),
				inventoryLogger,
				HttpStatus.NOT_FOUND
			);
		}

		return logAndSuccess(
			{ resourceId, removed: true },
			`Successfully removed inventory for resource ${resourceId}`,
			{ resourceId },
			inventoryLogger
		);
	} catch (err) {
		return logAndError(
			'Error removing resource inventory',
			{ error: err as Error },
			inventoryLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
