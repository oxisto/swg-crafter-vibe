/**
 * @fileoverview Root page server loader for the SWG Shipwright application.
 * Redirects users from the root path to the main inventory page.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

/**
 * Page load function that redirects users to the inventory page.
 * The application's primary interface is the inventory management system,
 * so we redirect users there for the main entry point.
 *
 * @returns {never} Throws a redirect response to /inventory
 */
export const load: PageServerLoad = async () => {
	// Redirect to the inventory page
	throw redirect(302, '/inventory');
};
