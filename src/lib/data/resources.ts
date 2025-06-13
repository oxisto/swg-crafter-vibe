/**
 * Resources Data Module
 *
 * Handles resource data management including downloading from SWGAide,
 * XML parsing, spawn lifecycle management, and database storage operations.
 */

import type { Resource } from '../types.js';
import { getDatabase, dbLogger } from './database.js';
import { checkCacheStatus, updateCacheTimestamp, CACHE_CONFIG } from './cache.js';
import { downloadAndExtractXML, parseXMLContent } from './xml-parser.js';

// Resources data source
const RESOURCES_URL = 'https://swgaide.com/pub/exports/currentresources_162.xml.gz';

/**
 * Downloads and caches current resource data from SWGAide.
 * Checks if the cache is still fresh (within 6 hours) before downloading.
 * Downloads compressed XML data, extracts it, parses it, and stores in the database.
 * @returns Promise that resolves when the operation is complete
 */
export async function downloadAndCacheResources(): Promise<void> {
	const { isFresh, hoursOld } = checkCacheStatus(
		CACHE_CONFIG.RESOURCES.CACHE_KEY,
		CACHE_CONFIG.RESOURCES.TABLE,
		CACHE_CONFIG.RESOURCES.DURATION_HOURS
	);

	if (isFresh) {
		dbLogger.debug(
			`Resources cache fresh (${Math.round(hoursOld * 10) / 10}h old), skipping download`
		);
		return;
	}

	if (hoursOld !== Infinity) {
		dbLogger.info(
			`Resources cache expired (${Math.round(hoursOld * 10) / 10}h old), starting refresh`
		);
	} else {
		dbLogger.info('No resources cache found, performing initial download');
	}

	const totalStartTime = Date.now();

	try {
		// Download and extract XML
		const xmlContent = await downloadAndExtractXML(RESOURCES_URL, 'temp_resources.xml.gz');

		// Parse the XML
		const parsedData = parseXMLContent(xmlContent);

		// Process and store resources
		await processResources(parsedData);

		// Update cache timestamp
		updateCacheTimestamp(
			CACHE_CONFIG.RESOURCES.CACHE_KEY,
			CACHE_CONFIG.RESOURCES.TABLE
		);

		dbLogger.info(
			`Resources cache update completed (${Math.round((Date.now() - totalStartTime) / 1000)}s)`
		);
	} catch (error) {
		dbLogger.error('Failed to download and cache resources', { error: error as Error });
		// Don't throw - let the app continue without resource data
	}
}

/**
 * Processes and stores parsed resource data in the database.
 * Implements spawn lifecycle management - marks existing resources as despawned if not in current XML,
 * and adds new resources or updates existing ones that are still spawning.
 * @param parsedData - The parsed XML data containing resource information
 * @returns Promise that resolves when processing is complete
 */
async function processResources(parsedData: any): Promise<void> {
	const db = getDatabase();
	const currentTime = new Date().toISOString();

	// Extract resources from parsed XML - the structure is resource_data.resources.resource
	const resources = parsedData?.resource_data?.resources?.resource || [];
	const resourcesArray = Array.isArray(resources) ? resources : [resources];

	// Get list of currently spawned resource IDs from XML
	const currentSpawnIds = new Set(
		resourcesArray.filter((r) => r && r._swgaide_id).map((r) => r._swgaide_id)
	);

	// Start transaction for all operations
	const processTransaction = db.transaction(() => {
		// 1. Mark all currently spawned resources as despawned if they're not in the new data
		const markDespawnedStmt = db.prepare(`
			UPDATE resources 
			SET is_currently_spawned = 0, 
				despawn_date = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE is_currently_spawned = 1 
			AND id NOT IN (${
				Array.from(currentSpawnIds)
					.map(() => '?')
					.join(',') || 'NULL'
			})
		`);

		if (currentSpawnIds.size > 0) {
			markDespawnedStmt.run(currentTime, ...Array.from(currentSpawnIds));
		} else {
			// If no current spawns, mark all as despawned
			db.prepare(
				`
				UPDATE resources 
				SET is_currently_spawned = 0, 
					despawn_date = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE is_currently_spawned = 1
			`
			).run(currentTime);
		}

		// 2. Prepare statements for insert/update operations
		const insertStmt = db.prepare(`
			INSERT INTO resources (
				id, name, type, class_name, class_path, 
				attributes, planet_distribution, enter_date, 
				despawn_date, is_currently_spawned, stats
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const updateStmt = db.prepare(`
			UPDATE resources 
			SET name = ?, type = ?, class_name = ?, class_path = ?,
				attributes = ?, planet_distribution = ?, 
				is_currently_spawned = 1, despawn_date = NULL,
				stats = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);

		const checkExistsStmt = db.prepare('SELECT id FROM resources WHERE id = ?');

		// 3. Process each resource from the XML
		for (const rawResource of resourcesArray) {
			if (rawResource && rawResource._swgaide_id && rawResource.name) {
				const resourceId = rawResource._swgaide_id;

				// Extract attributes from stats object
				const attributes: Record<string, number> = {};
				if (rawResource.stats) {
					const attributeNames = ['cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'oq', 'sr', 'ut', 'er'];
					for (const attr of attributeNames) {
						if (rawResource.stats[attr] !== undefined) {
							attributes[attr] = parseInt(rawResource.stats[attr], 10);
						}
					}
				}

				// Extract planet distribution from planets object
				const planetDistribution: Record<string, number> = {};
				if (rawResource.planets && rawResource.planets.planet) {
					const planets = Array.isArray(rawResource.planets.planet)
						? rawResource.planets.planet
						: [rawResource.planets.planet];

					for (const planet of planets) {
						if (planet.name) {
							// For now, assume equal distribution. Real concentrations would need waypoint data
							planetDistribution[planet.name] = 100;
						}
					}
				}

				// Build class path from type (simplified approach)
				const classPath = rawResource.type ? rawResource.type.split(' ') : [];

				// Calculate simple stats
				const stats = {
					overallQuality: calculateOverallQuality(attributes),
					bestUses: calculateBestUses(attributes, rawResource.type || ''),
					averageConcentration: calculateAverageConcentration(planetDistribution)
				};

				// Check if resource already exists
				const exists = checkExistsStmt.get(resourceId);

				if (exists) {
					// Update existing resource (mark as currently spawned again)
					updateStmt.run(
						rawResource.name,
						rawResource.type || '',
						rawResource.type || '', // Using type as class_name for now
						JSON.stringify(classPath),
						JSON.stringify(attributes),
						JSON.stringify(planetDistribution),
						JSON.stringify(stats),
						resourceId
					);
				} else {
					// Insert new resource
					insertStmt.run(
						resourceId,
						rawResource.name,
						rawResource.type || '',
						rawResource.type || '', // Using type as class_name for now
						JSON.stringify(classPath),
						JSON.stringify(attributes),
						JSON.stringify(planetDistribution),
						currentTime, // enter_date
						null, // despawn_date (currently spawned)
						1, // is_currently_spawned
						JSON.stringify(stats)
					);
				}
			}
		}
	});

	// Execute the transaction
	processTransaction();

	const totalResources = db.prepare('SELECT COUNT(*) as count FROM resources').get() as {
		count: number;
	};
	const currentlySpawned = db
		.prepare('SELECT COUNT(*) as count FROM resources WHERE is_currently_spawned = 1')
		.get() as { count: number };

	dbLogger.info(
		`Processed ${resourcesArray.length} current spawns. Total resources in DB: ${totalResources.count}, Currently spawned: ${currentlySpawned.count}`
	);
}

/**
 * Calculate the overall quality score for a resource based on its attributes
 * @param attributes - Resource attributes
 * @returns Quality score between 0-1000
 */
function calculateOverallQuality(attributes: Record<string, number>): number {
	if (!attributes || Object.keys(attributes).length === 0) return 0;

	const sum = Object.values(attributes).reduce((acc, val) => acc + val, 0);
	const avg = sum / Object.values(attributes).length;
	return Math.round(avg);
}

/**
 * Determine best uses for a resource based on its attributes and class
 * @param attributes - Resource attributes
 * @param className - Resource class name
 * @returns Array of best uses
 */
function calculateBestUses(attributes: Record<string, number>, className: string): string[] {
	const bestUses: string[] = [];

	// Very basic implementation - can be expanded with more sophisticated logic
	if (attributes.oq > 900) bestUses.push('High Quality Crafting');
	if (attributes.sr > 800) bestUses.push('Weapon Crafting');

	if (className.includes('Metal') && attributes.ma > 800) {
		bestUses.push('Armor Crafting');
	}

	if (className.includes('Chemical') && attributes.pe > 800) {
		bestUses.push('Ship Components');
	}

	// If no specific uses found
	if (bestUses.length === 0) bestUses.push('General Use');

	return bestUses;
}

/**
 * Calculate average concentration across all planets where resource is present
 * @param planetDistribution - Resource planet distribution
 * @returns Average concentration percentage
 */
function calculateAverageConcentration(planetDistribution: Record<string, number>): number {
	if (!planetDistribution || Object.keys(planetDistribution).length === 0) return 0;

	const values = Object.values(planetDistribution).filter((v) => v > 0);
	if (values.length === 0) return 0;

	const sum = values.reduce((acc, val) => acc + val, 0);
	return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Retrieves all resources from the database.
 * @returns Array of all resource objects
 */
export function getAllResources(): Resource[] {
	const db = getDatabase();
	const rows = db.prepare('SELECT * FROM resources ORDER BY enter_date DESC').all() as Array<{
		id: string;
		name: string;
		type: string;
		class_name: string;
		class_path: string;
		attributes: string;
		planet_distribution: string;
		enter_date: string;
		despawn_date: string | null;
		is_currently_spawned: number;
		soap_last_updated: string | null;
		stats: string;
	}>;

	return rows
		.map((row) => {
			try {
				const attributes = JSON.parse(row.attributes);
				const planetDistribution = JSON.parse(row.planet_distribution);
				const stats = row.stats ? JSON.parse(row.stats) : undefined;
				const classPath = row.class_path ? JSON.parse(row.class_path) : undefined;

				return {
					id: row.id,
					name: row.name,
					type: row.type,
					className: row.class_name,
					classPath,
					attributes,
					planetDistribution,
					enterDate: row.enter_date,
					despawnDate: row.despawn_date || undefined,
					isCurrentlySpawned: Boolean(row.is_currently_spawned),
					soapLastUpdated: row.soap_last_updated || undefined,
					stats
				};
			} catch (error) {
				dbLogger.error(`Failed to parse resource data for ${row.id}`, {
					error: error as Error,
					resourceId: row.id
				});
				return null;
			}
		})
		.filter(Boolean) as Resource[];
}

/**
 * Retrieves resources filtered by class.
 * @param className - The class name to filter by
 * @returns Array of resources matching the class
 */
export function getResourcesByClass(className: string): Resource[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			'SELECT * FROM resources WHERE class_name = ? OR class_path LIKE ? ORDER BY enter_date DESC'
		)
		.all(className, `%${className}%`) as Array<{
		id: string;
		name: string;
		type: string;
		class_name: string;
		class_path: string;
		attributes: string;
		planet_distribution: string;
		enter_date: string;
		despawn_date: string | null;
		is_currently_spawned: number;
		soap_last_updated: string | null;
		stats: string;
	}>;

	return rows
		.map((row) => {
			try {
				const attributes = JSON.parse(row.attributes);
				const planetDistribution = JSON.parse(row.planet_distribution);
				const stats = row.stats ? JSON.parse(row.stats) : undefined;
				const classPath = row.class_path ? JSON.parse(row.class_path) : undefined;

				return {
					id: row.id,
					name: row.name,
					type: row.type,
					className: row.class_name,
					classPath,
					attributes,
					planetDistribution,
					enterDate: row.enter_date,
					despawnDate: row.despawn_date || undefined,
					isCurrentlySpawned: Boolean(row.is_currently_spawned),
					soapLastUpdated: row.soap_last_updated || undefined,
					stats
				};
			} catch (error) {
				dbLogger.error(`Failed to parse resource data for ${row.id}`, {
					error: error as Error,
					resourceId: row.id,
					context: 'getResourcesByClass'
				});
				return null;
			}
		})
		.filter(Boolean) as Resource[];
}

/**
 * Retrieves resources filtered by name search.
 * @param searchTerm - The term to search resource names for
 * @returns Array of resources matching the search term
 */
export function searchResources(searchTerm: string): Resource[] {
	const db = getDatabase();
	const rows = db
		.prepare('SELECT * FROM resources WHERE name LIKE ? ORDER BY enter_date DESC')
		.all(`%${searchTerm}%`) as Array<{
		id: string;
		name: string;
		type: string;
		class_name: string;
		class_path: string;
		attributes: string;
		planet_distribution: string;
		enter_date: string;
		despawn_date: string | null;
		is_currently_spawned: number;
		soap_last_updated: string | null;
		stats: string;
	}>;

	return rows
		.map((row) => {
			try {
				const attributes = JSON.parse(row.attributes);
				const planetDistribution = JSON.parse(row.planet_distribution);
				const stats = row.stats ? JSON.parse(row.stats) : undefined;
				const classPath = row.class_path ? JSON.parse(row.class_path) : undefined;

				return {
					id: row.id,
					name: row.name,
					type: row.type,
					className: row.class_name,
					classPath,
					attributes,
					planetDistribution,
					enterDate: row.enter_date,
					despawnDate: row.despawn_date || undefined,
					isCurrentlySpawned: Boolean(row.is_currently_spawned),
					soapLastUpdated: row.soap_last_updated || undefined,
					stats
				};
			} catch (error) {
				dbLogger.error(`Failed to parse resource data for ${row.id}`, {
					error: error as Error,
					resourceId: row.id,
					context: 'searchResources'
				});
				return null;
			}
		})
		.filter(Boolean) as Resource[];
}

/**
 * Retrieves a specific resource by its ID.
 * @param id - The resource ID to retrieve
 * @returns The resource object if found, null otherwise
 */
export function getResourceById(id: string): Resource | null {
	const db = getDatabase();
	const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as
		| {
				id: string;
				name: string;
				type: string;
				class_name: string;
				class_path: string;
				attributes: string;
				planet_distribution: string;
				enter_date: string;
				despawn_date: string | null;
				is_currently_spawned: number;
				soap_last_updated: string | null;
				stats: string;
		  }
		| undefined;

	if (!row) return null;

	try {
		const attributes = JSON.parse(row.attributes);
		const planetDistribution = JSON.parse(row.planet_distribution);
		const stats = row.stats ? JSON.parse(row.stats) : undefined;
		const classPath = row.class_path ? JSON.parse(row.class_path) : undefined;

		return {
			id: row.id,
			name: row.name,
			type: row.type,
			className: row.class_name,
			classPath,
			attributes,
			planetDistribution,
			enterDate: row.enter_date,
			despawnDate: row.despawn_date || undefined,
			isCurrentlySpawned: Boolean(row.is_currently_spawned),
			soapLastUpdated: row.soap_last_updated || undefined,
			stats
		};
	} catch (error) {
		dbLogger.error(`Failed to parse resource data for ${row.id}`, {
			error: error as Error,
			resourceId: row.id,
			context: 'getResourceById'
		});
		return null;
	}
}
