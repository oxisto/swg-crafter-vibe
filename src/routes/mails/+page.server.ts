import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		// Get query parameters
		const sender = url.searchParams.get('sender') || '';
		const subject = url.searchParams.get('subject') || '';
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const limit = 50; // Items per page
		const offset = (page - 1) * limit;

		// Build query string
		const params = new URLSearchParams();
		params.set('action', 'list');
		if (sender) params.set('sender', sender);
		if (subject) params.set('subject', subject);
		params.set('limit', limit.toString());
		params.set('offset', offset.toString());

		// Fetch mails data
		const mailsResponse = await fetch(`/api/mails?${params}`);
		const mailsData = await mailsResponse.json();

		// Fetch import history
		const importsResponse = await fetch('/api/mails?action=imports');
		const importsData = await importsResponse.json();

		if (!mailsResponse.ok) {
			throw new Error('Failed to fetch mails data');
		}

		return {
			mails: mailsData.mails || [],
			total: mailsData.total || 0,
			imports: importsData.imports || [],
			pagination: {
				page,
				limit,
				total: mailsData.total || 0,
				totalPages: Math.ceil((mailsData.total || 0) / limit)
			},
			filters: {
				sender,
				subject
			}
		};
	} catch (error) {
		console.error('Failed to load mails data:', error);
		return {
			mails: [],
			total: 0,
			imports: [],
			pagination: {
				page: 1,
				limit: 50,
				total: 0,
				totalPages: 0
			},
			filters: {
				sender: '',
				subject: ''
			},
			error: 'Failed to load mails data'
		};
	}
};
