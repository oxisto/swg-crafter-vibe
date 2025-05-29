/**
 * Star Wars Galaxies Shipwright Database Module
 *
 * This module provides database functionality for managing inventory,
 * settings, and schematics data for the SWG shipwright business application.
 * Uses Better SQLite3 for local data persistence.
 */

import Database from 'better-sqlite3';
import {
	PART_CATEGORIES,
	MARK_LEVELS,
	getInventoryKey,
	type Inventory,
	type Schematic,
	type MailBatch,
	type MailData,
	type Sale,
	type MailImport,
	type SalesAnalytics,
	type MarkLevel,
	type PartCategory
} from '$lib/types.js';
import { XMLParser } from 'fast-xml-parser';
import { createWriteStream, existsSync, unlinkSync, readFileSync } from 'fs';
import { gunzipSync } from 'zlib';

const DB_PATH = 'database.sqlite3';

let db: Database.Database;

/**
 * Initializes the SQLite database and creates necessary tables.
 * Sets up inventory, settings, and schematics tables with proper schemas.
 * Automatically populates initial inventory data and downloads schematics if needed.
 */
export function initDatabase() {
	db = new Database(DB_PATH);

	// Create inventory table if it doesn't exist
	db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      mark_level TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, mark_level)
    )
  `);

	// Create settings table if it doesn't exist
	db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create schematics table if it doesn't exist
	db.exec(`
    CREATE TABLE IF NOT EXISTS schematics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      profession TEXT,
      complexity INTEGER,
      datapad INTEGER,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create schematics_cache table to track last update
	db.exec(`
    CREATE TABLE IF NOT EXISTS schematics_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create mails table for storing raw mail data
	db.exec(`
    CREATE TABLE IF NOT EXISTS mails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail_id TEXT UNIQUE NOT NULL,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      body TEXT NOT NULL,
      location TEXT,
      import_batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create mail_imports table for tracking imported mail batches
	db.exec(`
    CREATE TABLE IF NOT EXISTS mail_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      total_mails INTEGER NOT NULL,
      imported_mails INTEGER NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create sales table for tracking historical sales data
	db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail_id TEXT UNIQUE NOT NULL,
      timestamp DATETIME NOT NULL,
      item_name TEXT NOT NULL,
      buyer TEXT NOT NULL,
      credits INTEGER NOT NULL,
      location TEXT,
      category TEXT,
      mark_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Initialize with default values if empty
	const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };

	if (count.count === 0) {
		const insert = db.prepare(`
      INSERT INTO inventory (category, mark_level, quantity) 
      VALUES (?, ?, 0)
    `);

		const insertMany = db.transaction(() => {
			for (const category of PART_CATEGORIES) {
				for (const markLevel of MARK_LEVELS) {
					insert.run(category, markLevel);
				}
			}
		});

		insertMany();
	}

	// Initialize default settings if they don't exist
	const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as {
		count: number;
	};

	if (settingsCount.count === 0) {
		const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
		insertSetting.run('recommendedStockLevel', '10');

		// Initialize default sell values for each mark level
		for (const markLevel of MARK_LEVELS) {
			insertSetting.run(`sellValue_${markLevel}`, '0');
		}
	}

	// Download and cache schematics in the background
	downloadAndCacheSchematics().catch(console.error);

	return db;
}

/**
 * Gets the database instance, initializing it if not already done.
 * @returns The SQLite database instance
 */
export function getDatabase() {
	if (!db) {
		initDatabase();
	}
	return db;
}

/**
 * Retrieves all inventory items from the database.
 * @returns An inventory object with keys in format "{category}-{markLevel}" and quantity values
 */
export function getAllInventory(): Inventory {
	const db = getDatabase();
	const rows = db.prepare('SELECT category, mark_level, quantity FROM inventory').all() as Array<{
		category: string;
		mark_level: string;
		quantity: number;
	}>;

	const inventory: Inventory = {};

	for (const row of rows) {
		const key = getInventoryKey(row.category as any, row.mark_level as any);
		inventory[key] = row.quantity;
	}

	return inventory;
}

/**
 * Updates the quantity of a specific inventory item.
 * @param category - The part category (e.g., "Armor", "Engine")
 * @param markLevel - The mark level (e.g., "I", "II", "III", "IV", "V")
 * @param quantity - The new quantity value
 */
export function updateInventoryItem(category: string, markLevel: string, quantity: number): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    UPDATE inventory 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE category = ? AND mark_level = ?
  `);

	stmt.run(quantity, category, markLevel);
}

/**
 * Retrieves the quantity of a specific inventory item.
 * @param category - The part category
 * @param markLevel - The mark level
 * @returns The quantity of the item, or 0 if not found
 */
export function getInventoryItem(category: string, markLevel: string): number {
	const db = getDatabase();
	const stmt = db.prepare('SELECT quantity FROM inventory WHERE category = ? AND mark_level = ?');
	const result = stmt.get(category, markLevel) as { quantity: number } | undefined;

	return result?.quantity ?? 0;
}

/**
 * Retrieves a specific inventory item with its update timestamp.
 * @param category - The part category
 * @param markLevel - The mark level
 * @returns The inventory item with quantity and update timestamp, or null if not found
 */
export function getInventoryItemWithTimestamp(
	category: string,
	markLevel: string
): {
	quantity: number;
	updatedAt: string;
} | null {
	const db = getDatabase();
	const stmt = db.prepare(
		'SELECT quantity, updated_at FROM inventory WHERE category = ? AND mark_level = ?'
	);
	const result = stmt.get(category, markLevel) as
		| { quantity: number; updated_at: string }
		| undefined;

	if (!result) return null;

	return {
		quantity: result.quantity,
		updatedAt: result.updated_at
	};
}

/**
 * Retrieves all inventory items with their update timestamps.
 * @returns An array of inventory items with quantities and update timestamps
 */
export function getAllInventoryWithTimestamps(): Array<{
	category: string;
	markLevel: string;
	quantity: number;
	updatedAt: string;
}> {
	const db = getDatabase();
	const rows = db
		.prepare(
			'SELECT category, mark_level, quantity, updated_at FROM inventory ORDER BY updated_at DESC'
		)
		.all() as Array<{
		category: string;
		mark_level: string;
		quantity: number;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));
}

/**
 * Gets the most recently updated inventory items.
 * @param limit - Maximum number of items to return (default: 10)
 * @returns An array of recently updated inventory items
 */
export function getRecentlyUpdatedInventory(limit: number = 10): Array<{
	category: string;
	markLevel: string;
	quantity: number;
	updatedAt: string;
}> {
	const db = getDatabase();
	const stmt = db.prepare(`
		SELECT category, mark_level, quantity, updated_at 
		FROM inventory 
		WHERE updated_at > datetime('now', '-7 days')
		ORDER BY updated_at DESC 
		LIMIT ?
	`);

	const rows = stmt.all(limit) as Array<{
		category: string;
		mark_level: string;
		quantity: number;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		category: row.category,
		markLevel: row.mark_level,
		quantity: row.quantity,
		updatedAt: row.updated_at
	}));
}

// Settings functions
/**
 * Retrieves a setting value by key.
 * @param key - The setting key to retrieve
 * @returns The setting value, or null if not found
 */
export function getSetting(key: string): string | null {
	const db = getDatabase();
	const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
	const result = stmt.get(key) as { value: string } | undefined;

	return result?.value ?? null;
}

/**
 * Sets or updates a setting value.
 * @param key - The setting key
 * @param value - The setting value to store
 */
export function setSetting(key: string, value: string): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);

	stmt.run(key, value);
}

/**
 * Gets the recommended stock level setting.
 * @returns The recommended stock level, defaults to 10 if not set
 */
export function getRecommendedStockLevel(): number {
	const value = getSetting('recommendedStockLevel');
	return value ? parseInt(value, 10) : 10;
}

/**
 * Sets the recommended stock level setting.
 * @param level - The new recommended stock level
 */
export function setRecommendedStockLevel(level: number): void {
	setSetting('recommendedStockLevel', level.toString());
}

/**
 * Gets sell values for all mark levels.
 * @returns An object mapping mark levels to their sell values
 */
export function getSellValues(): Record<string, number> {
	const sellValues: Record<string, number> = {};

	for (const markLevel of MARK_LEVELS) {
		const value = getSetting(`sellValue_${markLevel}`);
		sellValues[markLevel] = value ? parseFloat(value) : 0;
	}

	return sellValues;
}

/**
 * Sets the sell value for a specific mark level.
 * @param markLevel - The mark level to set the sell value for
 * @param value - The sell value
 */
export function setSellValue(markLevel: string, value: number): void {
	setSetting(`sellValue_${markLevel}`, value.toString());
}

/**
 * Sets sell values for all mark levels.
 * @param sellValues - An object mapping mark levels to their sell values
 */
export function setSellValues(sellValues: Record<string, number>): void {
	for (const [markLevel, value] of Object.entries(sellValues)) {
		setSellValue(markLevel, value);
	}
}

// Schematics functionality
const SCHEMATICS_URL = 'https://swgaide.com/pub/exports/schematics_unity.xml.gz';
const SCHEMATICS_CACHE_KEY = 'schematics_last_update';
const CACHE_DURATION_HOURS = 24; // Cache for 24 hours

/**
 * Downloads and caches schematics data from SWGAide.
 * Checks if the cache is still fresh (within 24 hours) before downloading.
 * Downloads compressed XML data, extracts it, parses it, and stores in the database.
 * @returns Promise that resolves when the operation is complete
 */
export async function downloadAndCacheSchematics(): Promise<void> {
	const db = getDatabase();

	// Check if we need to update the cache
	const lastUpdate = db
		.prepare('SELECT value FROM schematics_cache WHERE key = ?')
		.get(SCHEMATICS_CACHE_KEY) as { value: string } | undefined;

	if (lastUpdate) {
		const lastUpdateTime = new Date(lastUpdate.value);
		const now = new Date();
		const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

		if (hoursSinceUpdate < CACHE_DURATION_HOURS) {
			console.log('Schematics cache is still fresh, skipping download');
			return;
		}
	}

	console.log('Downloading schematics from SWGAide...');

	try {
		// Download the compressed XML file
		const tempFile = 'temp_schematics.xml.gz';
		const response = await fetch(SCHEMATICS_URL);

		if (!response.ok) {
			throw new Error(`Failed to download schematics: ${response.statusText}`);
		}

		// Save the gzipped file temporarily
		const buffer = await response.arrayBuffer();
		const fileStream = createWriteStream(tempFile);
		fileStream.write(Buffer.from(buffer));
		fileStream.end();

		// Wait for the file to be written
		await new Promise<void>((resolve, reject) => {
			fileStream.on('finish', () => resolve());
			fileStream.on('error', reject);
		});

		// Extract and parse the XML
		const compressedData = readFileSync(tempFile);
		const xmlContent = gunzipSync(compressedData).toString('utf-8');

		// Parse the XML
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '_',
			textNodeName: 'text'
		});

		const parsedData = parser.parse(xmlContent);

		// Process and store schematics
		await processSchematics(parsedData);

		// Update cache timestamp
		const stmt = db.prepare(`
      INSERT INTO schematics_cache (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
		stmt.run(SCHEMATICS_CACHE_KEY, new Date().toISOString());

		// Clean up temporary files
		if (existsSync(tempFile)) {
			unlinkSync(tempFile);
		}

		console.log('Schematics cache updated successfully');
	} catch (error) {
		console.error('Failed to download and cache schematics:', error);
		// Don't throw - let the app continue without schematics data
	}
}

/**
 * Processes and stores parsed schematics data in the database.
 * Clears existing schematics and inserts new data from the parsed XML.
 * @param parsedData - The parsed XML data containing schematic information
 * @returns Promise that resolves when processing is complete
 */
async function processSchematics(parsedData: any): Promise<void> {
	const db = getDatabase();

	// Clear existing schematics
	db.prepare('DELETE FROM schematics').run();

	// Extract schematics from parsed XML
	const schematics = parsedData?.schematics?.schematic || [];
	const schematicsArray = Array.isArray(schematics) ? schematics : [schematics];

	const insertStmt = db.prepare(`
    INSERT INTO schematics (id, name, category, profession, complexity, datapad, data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

	const insertMany = db.transaction(() => {
		for (const rawSchematic of schematicsArray) {
			if (rawSchematic && rawSchematic._id && rawSchematic._name) {
				// Convert raw schematic with underscore-prefixed properties to clean Schematic object
				const cleanSchematic: Schematic = {
					id: rawSchematic._id,
					name: rawSchematic._name,
					category: rawSchematic._category || '',
					profession: rawSchematic._profession || '',
					complexity: parseInt(rawSchematic._complexity) || 0,
					datapad: parseInt(rawSchematic._datapad) || 0,
					ingredients: [], // TODO: Parse ingredients from rawSchematic if needed
					resources: [] // TODO: Parse resources from rawSchematic if needed
				};

				insertStmt.run(
					cleanSchematic.id,
					cleanSchematic.name,
					cleanSchematic.category,
					cleanSchematic.profession,
					cleanSchematic.complexity,
					cleanSchematic.datapad,
					JSON.stringify(cleanSchematic)
				);
			}
		}
	});

	insertMany();
	console.log(`Processed ${schematicsArray.length} schematics`);
}

/**
 * Retrieves all schematics from the database.
 * @returns Array of all schematic objects
 */
export function getAllSchematics(): Schematic[] {
	const db = getDatabase();
	const rows = db.prepare('SELECT data FROM schematics').all() as Array<{ data: string }>;

	return rows
		.map((row) => {
			try {
				return JSON.parse(row.data) as Schematic;
			} catch {
				return null;
			}
		})
		.filter(Boolean) as Schematic[];
}

/**
 * Retrieves schematics filtered by category.
 * @param category - The category ID to filter by
 * @returns Array of schematics matching the category
 */
export function getSchematicsByCategory(category: string): Schematic[] {
	const db = getDatabase();
	const rows = db.prepare('SELECT data FROM schematics WHERE category = ?').all(category) as Array<{
		data: string;
	}>;

	return rows
		.map((row) => {
			try {
				return JSON.parse(row.data) as Schematic;
			} catch {
				return null;
			}
		})
		.filter(Boolean) as Schematic[];
}

/**
 * Retrieves a specific schematic by its ID.
 * @param id - The schematic ID to retrieve
 * @returns The schematic object if found, null otherwise
 */
export function getSchematicById(id: string): Schematic | null {
	const db = getDatabase();
	const row = db.prepare('SELECT data FROM schematics WHERE id = ?').get(id) as
		| { data: string }
		| undefined;

	if (!row) return null;

	try {
		return JSON.parse(row.data) as Schematic;
	} catch {
		return null;
	}
}

/**
 * Closes the database connection gracefully.
 * Should be called when the application is shutting down.
 */
export function closeDatabase() {
	if (db) {
		db.close();
	}
}

/**
 * Mail Management Functions
 * Functions for importing, managing, and processing raw mail data
 */

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
 * Sales Data Functions
 * Functions for managing sales tracking and analytics
 */

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
