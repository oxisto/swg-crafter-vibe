/**
 * Resources page server load function
 */
import * as db from '$lib/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const className = url.searchParams.get('class') || '';
	const searchTerm = url.searchParams.get('search') || '';

	let resources;

	if (className) {
		resources = db.getResourcesByClass(className);
	} else if (searchTerm) {
		resources = db.searchResources(searchTerm);
	} else {
		resources = db.getAllResources().slice(0, 100); // Limit to 100 resources for initial load
	}

	return {
		resources,
		filters: {
			className,
			searchTerm
		}
	};
};
