/**
 * Data access layer for schematic resource loadouts
 */

import { getDatabase } from '$lib/data/database/connection.js';
import { dbLogger } from '$lib/data/database/connection.js';
import type { Database } from 'better-sqlite3';
import {
	getSchematicLoadouts as dbGetSchematicLoadouts,
	getSchematicLoadoutResources as dbGetSchematicLoadoutResources,
	createSchematicLoadout as dbCreateSchematicLoadout,
	assignResourceToLoadout as dbAssignResourceToLoadout,
	deleteSchematicLoadout as dbDeleteSchematicLoadout,
	renameSchematicLoadout as dbRenameSchematicLoadout,
	type SchematicResourceLoadout,
	type SchematicLoadoutSummary
} from '$lib/data/database/schematic-resource-loadouts.js';

/**
 * Get all loadouts for a specific schematic
 */
export function getSchematicLoadouts(schematicId: string): SchematicLoadoutSummary[] {
	const db = getDatabase();
	return dbGetSchematicLoadouts(db, schematicId);
}

/**
 * Get all resource assignments for a specific loadout
 */
export function getSchematicLoadoutResources(
	schematicId: string,
	loadoutName: string
): SchematicResourceLoadout[] {
	const db = getDatabase();
	return dbGetSchematicLoadoutResources(db, schematicId, loadoutName);
}

/**
 * Create a new loadout for a schematic
 */
export function createSchematicLoadout(
	schematicId: string,
	loadoutName: string,
	resourceSlots: string[]
): void {
	const db = getDatabase();
	return dbCreateSchematicLoadout(db, schematicId, loadoutName, resourceSlots);
}

/**
 * Assign a resource to a loadout slot
 */
export function assignResourceToLoadout(
	schematicId: string,
	loadoutName: string,
	resourceSlotName: string,
	resourceId: number | null,
	resourceName: string | null
): void {
	const db = getDatabase();
	return dbAssignResourceToLoadout(
		db,
		schematicId,
		loadoutName,
		resourceSlotName,
		resourceId,
		resourceName
	);
}

/**
 * Delete a loadout
 */
export function deleteSchematicLoadout(schematicId: string, loadoutName: string): void {
	const db = getDatabase();
	return dbDeleteSchematicLoadout(db, schematicId, loadoutName);
}

/**
 * Rename a loadout
 */
export function renameSchematicLoadout(
	schematicId: string,
	oldLoadoutName: string,
	newLoadoutName: string
): void {
	const db = getDatabase();
	return dbRenameSchematicLoadout(db, schematicId, oldLoadoutName, newLoadoutName);
}

/**
 * Update the experimentation property for a specific loadout
 */
export function updateSchematicLoadoutExperimentationProperty(
	schematicId: string,
	loadoutName: string,
	experimentationProperty: string | null
): void {
	const db = getDatabase();
	return dbUpdateSchematicLoadoutExperimentationProperty(
		db,
		schematicId,
		loadoutName,
		experimentationProperty
	);
}

/**
 * Database function to update the experimentation property for a specific loadout
 */
function dbUpdateSchematicLoadoutExperimentationProperty(
	db: Database,
	schematicId: string,
	loadoutName: string,
	experimentationProperty: string | null
): void {
	try {
		const stmt = db.prepare(`
			UPDATE schematic_resource_loadouts 
			SET experimentation_property = ?, updated_at = datetime('now')
			WHERE schematic_id = ? AND loadout_name = ?
		`);

		const result = stmt.run(experimentationProperty, schematicId, loadoutName);

		if (result.changes === 0) {
			throw new Error('No loadout found to update experimentation property');
		}

		dbLogger.info('Updated schematic loadout experimentation property', {
			schematicId,
			loadoutName,
			experimentationProperty,
			updatedRows: result.changes
		});
	} catch (error) {
		dbLogger.error('Failed to update schematic loadout experimentation property', {
			error: error as Error,
			schematicId,
			loadoutName,
			experimentationProperty
		});
		throw error;
	}
}

// Re-export types for convenience
export type { SchematicResourceLoadout, SchematicLoadoutSummary };
