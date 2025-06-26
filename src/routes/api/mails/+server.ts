import { json } from '@sveltejs/kit';
import {
	getMails,
	getMailsCount,
	importMailBatch,
	extractSalesFromMails,
	getMailImports
} from '$lib/data';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const action = url.searchParams.get('action') || 'list';

		switch (action) {
			case 'list': {
				const sender = url.searchParams.get('sender');
				const subject = url.searchParams.get('subject');
				const startDate = url.searchParams.get('startDate');
				const endDate = url.searchParams.get('endDate');
				const limit = url.searchParams.get('limit');
				const offset = url.searchParams.get('offset');

				const options: any = {};
				if (sender) options.sender = sender;
				if (subject) options.subject = subject;
				if (startDate) options.startDate = startDate;
				if (endDate) options.endDate = endDate;
				if (limit) options.limit = parseInt(limit, 10);
				if (offset) options.offset = parseInt(offset, 10);

				const mails = getMails(options);
				const total = getMailsCount(options);

				return json({ mails, total });
			}

			case 'imports': {
				const imports = getMailImports();
				return json({ imports });
			}

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Failed to get mails data:', error);
		return json(
			{
				error: 'Failed to get mails data',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const action = body.action;

		switch (action) {
			case 'import': {
				const mailBatch = body.mailBatch;
				if (!mailBatch) {
					return json({ error: 'Mail batch data is required' }, { status: 400 });
				}

				const result = importMailBatch(mailBatch);
				return json({ result });
			}

			case 'extract-sales': {
				const extractedCount = extractSalesFromMails();
				return json({ extractedCount });
			}

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Failed to process mails request:', error);
		return json(
			{
				error: 'Failed to process mails request',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
