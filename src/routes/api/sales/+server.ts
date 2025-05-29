import { json } from '@sveltejs/kit';
import { getSales, getSalesAnalytics } from '$lib/database.js';
import type { PartCategory, MarkLevel } from '$lib/types.js';

export async function GET({ url }) {
	try {
		const action = url.searchParams.get('action') || 'list';

		switch (action) {
			case 'list': {
				const category = url.searchParams.get('category') as PartCategory | null;
				const markLevel = url.searchParams.get('markLevel') as MarkLevel | null;
				const startDate = url.searchParams.get('startDate');
				const endDate = url.searchParams.get('endDate');
				const limit = url.searchParams.get('limit');

				const options: any = {};
				if (category) options.category = category;
				if (markLevel) options.markLevel = markLevel;
				if (startDate) options.startDate = startDate;
				if (endDate) options.endDate = endDate;
				if (limit) options.limit = parseInt(limit, 10);

				const sales = getSales(options);
				return json({ sales });
			}

			case 'analytics': {
				const startDate = url.searchParams.get('startDate');
				const endDate = url.searchParams.get('endDate');

				const options: any = {};
				if (startDate) options.startDate = startDate;
				if (endDate) options.endDate = endDate;

				const analytics = getSalesAnalytics(options);
				return json({ analytics });
			}

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Failed to get sales data:', error);
		return json(
			{
				error: 'Failed to get sales data',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
