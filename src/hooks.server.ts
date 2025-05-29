import { initDatabase } from '$lib/database.js';
import type { Handle } from '@sveltejs/kit';

// Initialize database on server startup
initDatabase();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
