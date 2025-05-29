import { json } from '@sveltejs/kit';
import { getAllSchematics, getSchematicsByCategory, getSchematicById } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
	const category = url.searchParams.get('category');
	const id = url.searchParams.get('id');

	try {
		if (id) {
			// Get specific schematic by ID
			const schematic = getSchematicById(id);
			if (!schematic) {
				return new Response('Schematic not found', { status: 404 });
			}
			return json(schematic);
		} else if (category) {
			// Get schematics by category
			const schematics = getSchematicsByCategory(category);
			return json(schematics);
		} else {
			// Get all schematics
			const schematics = getAllSchematics();
			return json(schematics);
		}
	} catch (error) {
		console.error('Error fetching schematics:', error);
		return new Response('Internal server error', { status: 500 });
	}
};
