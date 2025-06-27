/**
 * Sales and mail-related type definitions for the Star Wars Galaxies shipwright system.
 * Contains types for mail processing, sales tracking, and analytics.
 */

import type { PartCategory, MarkLevel } from './inventory.js';

/** Raw mail data from mail analyzer tool */
export interface MailData {
	mail_id: string;
	sender: string;
	subject: string;
	timestamp: string;
	body: string;
	location?: string;
}

/** Sales data extracted and categorized from mail */
export interface Sale {
	id?: number;
	mail_id: string;
	timestamp: string;
	item_name: string;
	buyer: string;
	credits: number;
	location?: string;
	category?: PartCategory;
	mark_level?: MarkLevel;
	created_at?: string;
}

/** Mail import batch statistics */
export interface MailImport {
	id?: number;
	batch_id: string;
	total_mails: number;
	imported_mails: number;
	start_date?: string;
	end_date?: string;
	imported_at?: string;
}

/** Mail batch data from analyzer tool */
export interface MailBatch {
	mails: MailData[];
	stats: MailStats;
}

/** Statistics about parsed mail batch */
export interface MailStats {
	total_mails: number;
	date_range: {
		start_date: string;
		end_date: string;
	};
	senders: Record<string, number>;
}

/** Sales analytics for dashboard */
export interface SalesAnalytics {
	totalSales: number;
	totalCredits: number;
	averagePrice: number;
	salesByCategory: Record<PartCategory, number>;
	salesByMarkLevel: Record<MarkLevel, number>;
	creditsOverTime: Array<{ date: string; credits: number }>;
}
