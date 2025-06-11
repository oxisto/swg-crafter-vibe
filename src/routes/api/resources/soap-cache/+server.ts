/**
 * SOAP Cache management API endpoint
 */
import { json } from '@sveltejs/kit';
import * as db from '$lib/database';
import type { RequestHandler } from './$types';

/**
 * GET /api/resources/soap-cache
 * Get SOAP cache statistics
 */
export const GET: RequestHandler = async () => {
	try {
		const stats = db.getSOAPCacheStats();

		return json({
			success: true,
			cache: stats,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Failed to get SOAP cache stats:', error);
		return json(
			{
				success: false,
				error: 'Failed to get cache statistics'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE /api/resources/soap-cache
 * Clean up expired SOAP cache entries
 */
export const DELETE: RequestHandler = async () => {
	try {
		const cleaned = db.cleanupSOAPCache();
		const stats = db.getSOAPCacheStats();

		return json({
			success: true,
			cleaned,
			cache: stats,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Failed to cleanup SOAP cache:', error);
		return json(
			{
				success: false,
				error: 'Failed to cleanup cache'
			},
			{ status: 500 }
		);
	}
};
