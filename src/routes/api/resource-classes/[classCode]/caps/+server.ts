/**
 * API endpoint for getting resource class caps
 * GET /api/resource-classes/[classCode]/caps
 */

import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { getDatabase } from '$lib/data/database.js';
import type { ResourceCaps } from '$lib/types/resources.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { classCode } = params;

		if (!classCode) {
			return logAndError('Missing classCode parameter', {}, undefined, HttpStatus.BAD_REQUEST);
		}

		const db = getDatabase();
		const stmt = db.prepare(`
			SELECT 
				oq_max as oq,
				pe_max as pe,
				dr_max as dr,
				fl_max as fl,
				hr_max as hr,
				ma_max as ma,
				cd_max as cd,
				cr_max as cr,
				sh_max as sh,
				ut_max as ut,
				sr_max as sr
			FROM resource_classes 
			WHERE swgcraft_id = ? OR LOWER(name) = LOWER(?)
		`);

		const row = stmt.get(classCode, classCode) as Record<string, number | null> | undefined;

		if (!row) {
			return logAndError(
				`Resource class not found: ${classCode}`,
				{},
				undefined,
				HttpStatus.NOT_FOUND
			);
		}

		// Convert null values to undefined and filter out zero values
		const caps: ResourceCaps = {};
		for (const [key, value] of Object.entries(row)) {
			if (typeof value === 'number' && value > 0) {
				caps[key as keyof ResourceCaps] = value;
			}
		}

		return logAndSuccess(caps, `Retrieved caps for resource class: ${classCode}`, { classCode });
	} catch (error) {
		return logAndError(
			`Failed to get resource class caps: ${error}`,
			{},
			undefined,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
