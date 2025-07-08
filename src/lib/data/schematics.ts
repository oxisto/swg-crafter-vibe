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
import { createCleanSchematic } from './utils/schematic-parser.js';

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
				const cleanSchematic = createCleanSchematic(rawSchematic);

				insertStmt.run(
					parseInt(cleanSchematic.id), // Convert to integer for database
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
	const rows = db.prepare('SELECT data, is_favorite FROM schematics').all() as Array<{
		data: string;
		is_favorite: number;
	}>;

	return rows
		.map((row) => {
			try {
				const schematic = JSON.parse(row.data) as Schematic;
				schematic.is_favorite = Boolean(row.is_favorite);
				return schematic;
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
 * Toggle the favorite status of a schematic
 * @param schematicId The ID of the schematic to toggle
 * @returns True if now favorited, false if unfavorited
 */
export function toggleSchematicFavorite(schematicId: string): boolean {
	const db = getDatabase();

	try {
		// Get current favorite status
		const current = db
			.prepare('SELECT is_favorite FROM schematics WHERE id = ?')
			.get(schematicId) as { is_favorite: number } | undefined;

		if (!current) {
			throw new Error(`Schematic with ID ${schematicId} not found`);
		}

		const newStatus = current.is_favorite ? 0 : 1;

		// Update the favorite status
		const stmt = db.prepare('UPDATE schematics SET is_favorite = ? WHERE id = ?');
		stmt.run(newStatus, schematicId);

		dbLogger.info(`Toggled schematic ${schematicId} favorite status to ${Boolean(newStatus)}`);
		return Boolean(newStatus);
	} catch (error) {
		dbLogger.error('Error toggling schematic favorite', { error: error as Error, schematicId });
		throw error;
	}
}

/**
 * Mark all schematics that have resource loadouts as favorites
 * This is a utility function to restore favorites for schematics with loadouts
 * @returns Number of schematics marked as favorites
 */
export function markSchematicsWithLoadoutsAsFavorites(): number {
	const db = getDatabase();

	try {
		// Find all unique schematic IDs that have loadouts
		const schematicsWithLoadouts = db
			.prepare(
				`
				SELECT DISTINCT schematic_id 
				FROM schematic_resource_loadouts
			`
			)
			.all() as Array<{ schematic_id: string }>;

		if (schematicsWithLoadouts.length === 0) {
			dbLogger.info('No schematics with loadouts found');
			return 0;
		}

		// Update all these schematics to be favorites
		const updateStmt = db.prepare(`
			UPDATE schematics 
			SET is_favorite = 1 
			WHERE id = ? AND is_favorite = 0
		`);

		let updatedCount = 0;
		for (const { schematic_id } of schematicsWithLoadouts) {
			const result = updateStmt.run(schematic_id);
			if (result.changes > 0) {
				updatedCount++;
			}
		}

		dbLogger.info(`Marked ${updatedCount} schematics with loadouts as favorites`);
		return updatedCount;
	} catch (error) {
		dbLogger.error('Error marking schematics with loadouts as favorites', {
			error: error as Error
		});
		throw error;
	}
}
