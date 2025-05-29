import { json } from '@sveltejs/kit';
import { importMailBatch } from '$lib/database.js';
import type { MailBatch } from '$lib/types.js';

export async function POST({ request }) {
	try {
		const mailBatch: MailBatch = await request.json();

		// Validate the mail batch data
		if (!mailBatch.mails || !Array.isArray(mailBatch.mails)) {
			return json({ error: 'Invalid mail batch data' }, { status: 400 });
		}

		if (!mailBatch.stats) {
			return json({ error: 'Missing mail batch statistics' }, { status: 400 });
		}

		// Import the mail batch
		const importResult = importMailBatch(mailBatch);

		return json({
			success: true,
			import: importResult,
			message: `Successfully imported ${importResult.imported_sales} sales from ${importResult.total_mails} mail files`
		});
	} catch (error) {
		console.error('Failed to import mail batch:', error);
		return json({ error: 'Failed to import mail batch', details: error.message }, { status: 500 });
	}
}
