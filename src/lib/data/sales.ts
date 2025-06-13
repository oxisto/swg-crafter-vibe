/**
 * Sales Data Module
 *
 * Handles sales data management including extracting sales from mails,
 * analytics generation, and sales tracking.
 */

import {
	PART_CATEGORIES,
	MARK_LEVELS,
	type MailData,
	type Sale,
	type SalesAnalytics,
	type MarkLevel,
	type PartCategory
} from '../types.js';
import { getDatabase } from './database.js';

/**
 * Analyzes existing mails and extracts sales data
 * @returns Number of sales extracted
 */
export function extractSalesFromMails(): number {
	const db = getDatabase();

	// Get all auction sale mails that haven't been processed yet
	const saleMails = db
		.prepare(
			`
		SELECT m.* FROM mails m
		LEFT JOIN sales s ON m.mail_id = s.mail_id
		WHERE m.sender = 'SWG.Restoration.auctioner' 
		AND m.subject LIKE '%Sale Complete%'
		AND s.mail_id IS NULL
		ORDER BY m.timestamp
	`
		)
		.all() as MailData[];

	if (saleMails.length === 0) {
		return 0;
	}

	let extractedSales = 0;
	const sales: Sale[] = [];

	// Process each mail and extract sales data
	for (const mail of saleMails) {
		const sale = extractSaleFromMail(mail);
		if (sale) {
			sales.push(sale);
		}
	}

	// Insert sales in a transaction
	const insertSale = db.prepare(`
		INSERT OR IGNORE INTO sales (mail_id, timestamp, item_name, buyer, credits, location, category, mark_level)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const transaction = db.transaction(() => {
		for (const sale of sales) {
			const result = insertSale.run(
				sale.mail_id,
				sale.timestamp,
				sale.item_name,
				sale.buyer,
				sale.credits,
				sale.location,
				sale.category,
				sale.mark_level
			);
			if (result.changes > 0) {
				extractedSales++;
			}
		}
	});

	transaction();
	return extractedSales;
}

/**
 * Extracts sale information from raw mail data
 * @param mail - Raw mail data
 * @returns Sale object or null if not a valid sale
 */
function extractSaleFromMail(mail: MailData): Sale | null {
	let itemName: string;
	let buyer: string;
	let credits: number;

	// Try auction format: "Your auction of [SEA] Mark II Booster has been sold to Demi'Urge MorningStar for 15000 credits"
	const auctionMatch = mail.body.match(
		/Your auction of (?:\[.*?\] )?(.*?) has been sold to (.*?) for (\d+) credits/
	);

	if (auctionMatch) {
		itemName = auctionMatch[1].trim();
		buyer = auctionMatch[2].trim();
		credits = parseInt(auctionMatch[3], 10);
	} else {
		// Try vendor format: "Vendor: Dune SEA Shipyard - Crafted Ship Parts has sold [SEA] Mark III Durasteel Plating (966.4) to Wisehe Umo for 30000 credits."
		const vendorMatch = mail.body.match(
			/Vendor: .* has sold (?:\[.*?\] )?(.*?) to (.*?) for (\d+) credits/
		);

		if (vendorMatch) {
			itemName = vendorMatch[1].trim();
			buyer = vendorMatch[2].trim();
			credits = parseInt(vendorMatch[3], 10);
		} else {
			return null;
		}
	}

	// Extract mark level and category
	const { markLevel, category } = parseItemDetails(itemName);

	return {
		mail_id: mail.mail_id,
		timestamp: mail.timestamp,
		item_name: itemName,
		buyer,
		credits,
		location: mail.location,
		category,
		mark_level: markLevel
	};
}

/**
 * Parses item details to extract mark level and category
 * @param itemName - The item name from the sale
 * @returns Object with mark level and category
 */
function parseItemDetails(itemName: string): { markLevel?: MarkLevel; category?: PartCategory } {
	const name = itemName.trim();
	let markLevel: MarkLevel | undefined;
	let category: PartCategory | undefined;

	// Extract mark level
	const markMatch = name.match(/Mark (I{1,3}|IV|V)/);
	if (markMatch) {
		markLevel = markMatch[1] as MarkLevel;
	} else if (name.includes('Starter Line')) {
		markLevel = 'I';
	}

	// Extract category based on keywords
	const nameLower = name.toLowerCase();

	if (nameLower.includes('engine')) {
		category = 'Engine';
	} else if (nameLower.includes('reactor')) {
		category = 'Reactor';
	} else if (nameLower.includes('shield') || nameLower.includes('deflector')) {
		category = 'Shield';
	} else if (nameLower.includes('capacitor')) {
		category = 'Capacitor';
	} else if (nameLower.includes('armor') || nameLower.includes('plating')) {
		category = 'Armor';
	} else if (
		nameLower.includes('blaster') ||
		nameLower.includes('cannon') ||
		nameLower.includes('weapon')
	) {
		if (nameLower.includes('green')) {
			category = 'Blaster (Green)';
		} else if (nameLower.includes('red')) {
			category = 'Blaster (Red)';
		}
	} else if (nameLower.includes('booster')) {
		category = 'Booster';
	} else if (nameLower.includes('droid')) {
		category = 'Droid Interface';
	}

	return { markLevel, category };
}

/**
 * Retrieves sales data with optional filtering
 * @param options - Filter options
 * @returns Array of sales
 */
export function getSales(
	options: {
		category?: PartCategory;
		markLevel?: MarkLevel;
		startDate?: string;
		endDate?: string;
		limit?: number;
	} = {}
): Sale[] {
	const db = getDatabase();

	let query = 'SELECT * FROM sales WHERE 1=1';
	const params: any[] = [];

	if (options.category) {
		query += ' AND category = ?';
		params.push(options.category);
	}

	if (options.markLevel) {
		query += ' AND mark_level = ?';
		params.push(options.markLevel);
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
	}

	return db.prepare(query).all(...params) as Sale[];
}

/**
 * Generates sales analytics for the dashboard
 * @param options - Filter options
 * @returns Sales analytics object
 */
export function getSalesAnalytics(
	options: {
		startDate?: string;
		endDate?: string;
	} = {}
): SalesAnalytics {
	const db = getDatabase();

	let query = 'SELECT * FROM sales WHERE 1=1';
	const params: any[] = [];

	if (options.startDate) {
		query += ' AND timestamp >= ?';
		params.push(options.startDate);
	}

	if (options.endDate) {
		query += ' AND timestamp <= ?';
		params.push(options.endDate);
	}

	const sales = db.prepare(query).all(...params) as Sale[];

	const analytics: SalesAnalytics = {
		totalSales: sales.length,
		totalCredits: sales.reduce((sum, sale) => sum + sale.credits, 0),
		averagePrice: 0,
		salesByCategory: {} as Record<PartCategory, number>,
		salesByMarkLevel: {} as Record<MarkLevel, number>,
		creditsOverTime: []
	};

	if (sales.length > 0) {
		analytics.averagePrice = analytics.totalCredits / analytics.totalSales;

		// Initialize counters
		for (const category of PART_CATEGORIES) {
			analytics.salesByCategory[category] = 0;
		}
		for (const markLevel of MARK_LEVELS) {
			analytics.salesByMarkLevel[markLevel] = 0;
		}

		// Count by category and mark level
		for (const sale of sales) {
			if (sale.category) {
				analytics.salesByCategory[sale.category]++;
			}
			if (sale.mark_level) {
				analytics.salesByMarkLevel[sale.mark_level]++;
			}
		}

		// Group credits by date
		const creditsByDate: Record<string, number> = {};
		for (const sale of sales) {
			const date = sale.timestamp.split('T')[0]; // Get just the date part
			creditsByDate[date] = (creditsByDate[date] || 0) + sale.credits;
		}

		analytics.creditsOverTime = Object.entries(creditsByDate)
			.map(([date, credits]) => ({ date, credits }))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	return analytics;
}
