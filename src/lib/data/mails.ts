/**
 * Mail Management Module
 *
 * Handles mail data management including importing mail batches,
 * filtering, and retrieving mail data.
 */

import type { MailBatch, MailData, MailImport } from '../types.js';
import { getDatabase } from './database.js';

/**
 * Imports a batch of raw mail data without processing sales
 * @param mailBatch - The mail batch data from the analyzer tool
 * @returns Import statistics
 */
export function importMailBatch(mailBatch: MailBatch): MailImport {
	const db = getDatabase();

	// Generate unique batch ID
	const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	let importedMails = 0;

	// Insert mails in a transaction
	const insertMail = db.prepare(`
		INSERT OR IGNORE INTO mails (mail_id, sender, subject, timestamp, body, location, import_batch_id)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	const insertImport = db.prepare(`
		INSERT INTO mail_imports (batch_id, total_mails, imported_mails, start_date, end_date)
		VALUES (?, ?, ?, ?, ?)
	`);

	const transaction = db.transaction(() => {
		// Import all mails
		for (const mail of mailBatch.mails) {
			const result = insertMail.run(
				mail.mail_id,
				mail.sender,
				mail.subject,
				mail.timestamp,
				mail.body,
				mail.location || null,
				batchId
			);
			if (result.changes > 0) {
				importedMails++;
			}
		}

		return insertImport.run(
			batchId,
			mailBatch.stats.total_mails,
			importedMails,
			mailBatch.stats.date_range.start_date,
			mailBatch.stats.date_range.end_date
		);
	});

	const result = transaction();

	return {
		id: result.lastInsertRowid as number,
		batch_id: batchId,
		total_mails: mailBatch.stats.total_mails,
		imported_mails: importedMails,
		start_date: mailBatch.stats.date_range.start_date,
		end_date: mailBatch.stats.date_range.end_date
	};
}

/**
 * Retrieves all mails with optional filtering
 * @param options - Filter options
 * @returns Array of mails
 */
export function getMails(
	options: {
		sender?: string;
		subject?: string;
		startDate?: string;
		endDate?: string;
		limit?: number;
		offset?: number;
	} = {}
): MailData[] {
	const db = getDatabase();

	let query = 'SELECT * FROM mails WHERE 1=1';
	const params: any[] = [];

	if (options.sender) {
		query += ' AND sender LIKE ?';
		params.push(`%${options.sender}%`);
	}

	if (options.subject) {
		query += ' AND subject LIKE ?';
		params.push(`%${options.subject}%`);
	}

	if (options.startDate) {
		query += ' AND timestamp >= ?';
		params.push(options.startDate);
	}

	if (options.endDate) {
		query += ' AND timestamp <= ?';
		params.push(options.endDate);
	}

	query += ' ORDER BY timestamp DESC';

	if (options.limit) {
		query += ' LIMIT ?';
		params.push(options.limit);

		if (options.offset) {
			query += ' OFFSET ?';
			params.push(options.offset);
		}
	}

	return db.prepare(query).all(...params) as MailData[];
}

/**
 * Gets total count of mails with optional filtering
 * @param options - Filter options
 * @returns Total count of mails
 */
export function getMailsCount(
	options: {
		sender?: string;
		subject?: string;
		startDate?: string;
		endDate?: string;
	} = {}
): number {
	const db = getDatabase();

	let query = 'SELECT COUNT(*) as count FROM mails WHERE 1=1';
	const params: any[] = [];

	if (options.sender) {
		query += ' AND sender LIKE ?';
		params.push(`%${options.sender}%`);
	}

	if (options.subject) {
		query += ' AND subject LIKE ?';
		params.push(`%${options.subject}%`);
	}

	if (options.startDate) {
		query += ' AND timestamp >= ?';
		params.push(options.startDate);
	}

	if (options.endDate) {
		query += ' AND timestamp <= ?';
		params.push(options.endDate);
	}

	const result = db.prepare(query).get(...params) as { count: number };
	return result.count;
}

/**
 * Gets the list of mail import batches
 * @returns Array of mail import records
 */
export function getMailImports(): MailImport[] {
	const db = getDatabase();
	return db.prepare('SELECT * FROM mail_imports ORDER BY imported_at DESC').all() as MailImport[];
}
