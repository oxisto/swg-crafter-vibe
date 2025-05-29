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
	type Schematic
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
