import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Schematic } from '$lib/types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`/api/schematics/${params.id}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Schematic not found');
			}
			throw error(response.status, 'Failed to load schematic');
		}

		const schematic: Schematic = await response.json();

		return {
			schematic
		};
	} catch (err) {
		console.error('Error loading schematic:', err);
		throw error(500, 'Failed to load schematic data');
	}
};
