/**
 * Schematics Data Module
 *
 * Handles schematics data management including downloading from SWGAide,
 * XML parsing, and database storage operations.
 */

import type { Schematic } from '../types.js';
import { getDatabase, dbLogger } from './database.js';
import { checkCacheStatus, updateCacheTimestamp, CACHE_CONFIG } from './cache.js';
import { downloadAndExtractXML, parseXMLContent } from './xml-parser.js';

// Schematics data source
const SCHEMATICS_URL = 'https://swgaide.com/pub/exports/schematics_unity.xml.gz';

/**
 * Downloads and caches schematics data from SWGAide.
 * Checks if the cache is still fresh (within 24 hours) before downloading.
 * Downloads compressed XML data, extracts it, parses it, and stores in the database.
 * @returns Promise that resolves when the operation is complete
 */
export async function downloadAndCacheSchematics(): Promise<void> {
	const { isFresh, hoursOld } = checkCacheStatus(
		CACHE_CONFIG.SCHEMATICS.CACHE_KEY,
		CACHE_CONFIG.SCHEMATICS.TABLE,
		CACHE_CONFIG.SCHEMATICS.DURATION_HOURS
	);

	if (isFresh) {
		dbLogger.debug(
			`Schematics cache fresh (${Math.round(hoursOld * 10) / 10}h old), skipping download`
		);
		return;
	}

	if (hoursOld !== Infinity) {
		dbLogger.info(
			`Schematics cache expired (${Math.round(hoursOld * 10) / 10}h old), starting refresh`
		);
	} else {
		dbLogger.info('No schematics cache found, performing initial download');
	}

	const totalStartTime = Date.now();

	try {
		// Download and extract XML
		const xmlContent = await downloadAndExtractXML(SCHEMATICS_URL, 'temp_schematics.xml.gz');

		// Parse the XML
		const parsedData = parseXMLContent(xmlContent);

		// Process and store schematics
		await processSchematics(parsedData);

		// Update cache timestamp
		updateCacheTimestamp(CACHE_CONFIG.SCHEMATICS.CACHE_KEY, CACHE_CONFIG.SCHEMATICS.TABLE);

		dbLogger.info(
			`Schematics cache update completed (${Math.round((Date.now() - totalStartTime) / 1000)}s)`
		);
	} catch (error) {
		dbLogger.error('Failed to download and cache schematics', { error: error as Error });
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
	dbLogger.info(`Processed ${schematicsArray.length} schematics`);
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
