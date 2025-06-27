import {
	getMails,
	getMailsCount,
	importMailBatch,
	extractSalesFromMails,
	getMailImports
} from '$lib/data';
import { HttpStatus, logAndError, logAndSuccess } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types';

const mailsLogger = logger.child({ component: 'api', endpoint: 'mails' });

export const GET: RequestHandler = async ({ url, locals }) => {
	const apiLogger = locals?.logger?.child({ component: 'api', endpoint: 'mails' }) || mailsLogger;

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

				return logAndSuccess(
					{ mails, total },
					`Retrieved ${mails.length} mails (total: ${total})`,
					{ action, filters: options },
					apiLogger
				);
			}

			case 'imports': {
				const imports = getMailImports();

				return logAndSuccess(
					{ imports },
					`Retrieved ${imports.length} mail imports`,
					{ action },
					apiLogger
				);
			}

			default:
				return logAndError('Invalid action', { action }, apiLogger, HttpStatus.BAD_REQUEST);
		}
	} catch (error) {
		return logAndError(
			`Failed to get mails data: ${(error as Error).message}`,
			{ error: error as Error },
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const apiLogger = locals?.logger?.child({ component: 'api', endpoint: 'mails' }) || mailsLogger;

	try {
		const body = await request.json();
		const action = body.action;

		switch (action) {
			case 'import': {
				const mailBatch = body.mailBatch;
				if (!mailBatch) {
					return logAndError(
						'Mail batch data is required',
						{ action },
						apiLogger,
						HttpStatus.BAD_REQUEST
					);
				}

				const result = importMailBatch(mailBatch);

				return logAndSuccess(
					{ result },
					`Imported mail batch successfully`,
					{ action, batchSize: mailBatch.length || 0 },
					apiLogger
				);
			}

			case 'extract-sales': {
				const extractedCount = extractSalesFromMails();

				return logAndSuccess(
					{ extractedCount },
					`Extracted ${extractedCount} sales from mails`,
					{ action, extractedCount },
					apiLogger
				);
			}

			default:
				return logAndError('Invalid action', { action }, apiLogger, HttpStatus.BAD_REQUEST);
		}
	} catch (error) {
		return logAndError(
			`Failed to process mails request: ${(error as Error).message}`,
			{ error: error as Error },
			apiLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
