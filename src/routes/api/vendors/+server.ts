import { json } from '@sveltejs/kit';
import { logger } from '$lib/logger.js';
import { HttpStatus, logAndSuccess } from '$lib/api/utils.js';
import type { ListVendorsResponse } from '$lib/types/api.js';
import type { RequestHandler } from './$types.js';

const vendorsLogger = logger.child({ component: 'api', endpoint: 'vendors' });

export const GET: RequestHandler = async (): Promise<Response> => {
	try {
		// For now, return the hardcoded list of vendors
		// In the future, this could come from a database table
		const vendors = ['Drasi Crossing', 'Tox City'];

		return logAndSuccess(
			vendors,
			'Successfully fetched vendors',
			{ count: vendors.length },
			vendorsLogger
		);
	} catch (error) {
		return logAndSuccess(
			['Drasi Crossing', 'Tox City'], // fallback
			'Successfully fetched vendors (fallback)',
			{ count: 2 },
			vendorsLogger
		);
	}
};
