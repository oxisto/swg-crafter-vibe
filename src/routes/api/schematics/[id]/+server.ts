import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSchematicById } from '$lib/database';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const schematic = getSchematicById(params.id);

		if (!schematic) {
			throw error(404, 'Schematic not found');
		}

		return json(schematic);
	} catch (err) {
		console.error('Error fetching schematic:', err);
		throw error(500, 'Failed to fetch schematic data');
	}
};
