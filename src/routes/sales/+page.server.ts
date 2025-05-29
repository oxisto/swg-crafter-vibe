import type { PageServerLoad } from './$types';
import { getSalesAnalytics, getMailImports } from '$lib/database.js';

export const load: PageServerLoad = async () => {
	try {
		// Get recent analytics (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentAnalytics = getSalesAnalytics({
			startDate: thirtyDaysAgo.toISOString()
		});

		// Get all-time analytics
		const allTimeAnalytics = getSalesAnalytics();

		// Get import history
		const imports = getMailImports();

		return {
			recentAnalytics,
			allTimeAnalytics,
			imports
		};
	} catch (error) {
		console.error('Failed to load sales data:', error);
		return {
			recentAnalytics: null,
			allTimeAnalytics: null,
			imports: [],
			error: 'Failed to load sales data'
		};
	}
};
