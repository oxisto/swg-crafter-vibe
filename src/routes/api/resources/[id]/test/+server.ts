import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
};
