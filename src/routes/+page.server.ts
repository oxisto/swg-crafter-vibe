import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  // Redirect to the inventory page
  throw redirect(302, '/inventory');
};
