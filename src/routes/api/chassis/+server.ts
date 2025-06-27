import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { getAllChassis, updateChassisQuantity } from '$lib/data';
import { logger } from '$lib/logger.js';
import type { ListChassisResponse, UpdateChassisResponse } from '$lib/types/api.js';
import type { RequestHandler } from './$types.js';

const chassisLogger = logger.child({ component: 'api', endpoint: 'chassis' });

export const GET: RequestHandler = async (): Promise<Response> => {
	try {
		const chassis = getAllChassis();

		return logAndSuccess(
			chassis satisfies ListChassisResponse,
			'Successfully fetched chassis data',
			{ count: chassis.length },
			chassisLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching chassis data',
			{ error: err as Error },
			chassisLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

export const PATCH: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const { id, quantity } = await request.json();

		if (!id || quantity === undefined || quantity < 0) {
			return logAndError(
				'Invalid chassis ID or quantity',
				{ id, quantity },
				chassisLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		const updatedChassis = updateChassisQuantity(id, quantity);

		if (!updatedChassis) {
			return logAndError(
				'Chassis not found',
				{ id, quantity },
				chassisLogger,
				HttpStatus.NOT_FOUND
			);
		}

		return logAndSuccess(
			updatedChassis satisfies UpdateChassisResponse,
			'Successfully updated chassis',
			{ id, quantity },
			chassisLogger
		);
	} catch (err) {
		return logAndError(
			'Error updating chassis',
			{ error: err as Error },
			chassisLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
