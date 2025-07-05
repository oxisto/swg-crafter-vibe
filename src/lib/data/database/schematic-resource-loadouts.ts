/**
 * Database schema and operations for schematic resource loadouts
 */

import type { Database } from 'better-sqlite3';
import { dbLogger } from './connection.js';
import type { SchematicResourceLoadout, SchematicLoadoutSummary } from '$lib/types/loadouts.js';

// Re-export types for backward compatibility
export type { SchematicResourceLoadout, SchematicLoadoutSummary };

/**
 * Create the tables for schematic resource loadouts
 */
export function createSchematicResourceLoadoutsTable(db: Database): void {
	try {
		// Main table for storing resource assignments
		db.exec(`
			CREATE TABLE IF NOT EXISTS schematic_resource_loadouts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				schematic_id TEXT NOT NULL,
				loadout_name TEXT NOT NULL,
				resource_slot_name TEXT NOT NULL,
				assigned_resource_id INTEGER,
				assigned_resource_name TEXT,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				updated_at TEXT NOT NULL DEFAULT (datetime('now')),
				UNIQUE(schematic_id, loadout_name, resource_slot_name),
				FOREIGN KEY (assigned_resource_id) REFERENCES resources(id) ON DELETE SET NULL
			)
		`);

		// Index for faster lookups
		db.exec(`
			CREATE INDEX IF NOT EXISTS idx_schematic_resource_loadouts_schematic 
			ON schematic_resource_loadouts(schematic_id, loadout_name)
		`);

		dbLogger.info('Created schematic_resource_loadouts table');
	} catch (error) {
		dbLogger.error('Failed to create schematic_resource_loadouts table', { error: error as Error });
		throw error;
	}
}

/**
 * Get all loadouts for a specific schematic
 */
export function getSchematicLoadouts(db: Database, schematicId: string): SchematicLoadoutSummary[] {
	try {
		const stmt = db.prepare(`
			SELECT 
				schematic_id,
				loadout_name,
				COUNT(*) as total_slots,
				COUNT(assigned_resource_id) as assigned_slots,
				MIN(created_at) as created_at,
				MAX(updated_at) as updated_at
			FROM schematic_resource_loadouts 
			WHERE schematic_id = ?
			GROUP BY schematic_id, loadout_name
			ORDER BY loadout_name
		`);

		return stmt.all(schematicId) as SchematicLoadoutSummary[];
	} catch (error) {
		dbLogger.error('Failed to get schematic loadouts', { error: error as Error, schematicId });
		throw error;
	}
}

/**
 * Get all resource assignments for a specific loadout
 */
export function getSchematicLoadoutResources(
	db: Database,
	schematicId: string,
	loadoutName: string
): SchematicResourceLoadout[] {
	try {
		const stmt = db.prepare(`
			SELECT * FROM schematic_resource_loadouts 
			WHERE schematic_id = ? AND loadout_name = ?
			ORDER BY resource_slot_name
		`);

		return stmt.all(schematicId, loadoutName) as SchematicResourceLoadout[];
	} catch (error) {
		dbLogger.error('Failed to get loadout resources', {
			error: error as Error,
			schematicId,
			loadoutName
		});
		throw error;
	}
}

/**
 * Create a new loadout for a schematic
 */
export function createSchematicLoadout(
	db: Database,
	schematicId: string,
	loadoutName: string,
	resourceSlots: string[]
): void {
	try {
		const stmt = db.prepare(`
			INSERT INTO schematic_resource_loadouts 
			(schematic_id, loadout_name, resource_slot_name, assigned_resource_id, assigned_resource_name)
			VALUES (?, ?, ?, NULL, NULL)
		`);

		const insertMany = db.transaction((slots: string[]) => {
			for (const slot of slots) {
				stmt.run(schematicId, loadoutName, slot);
			}
		});

		insertMany(resourceSlots);

		dbLogger.info('Created schematic loadout', {
			schematicId,
			loadoutName,
			slotCount: resourceSlots.length
		});
	} catch (error) {
		dbLogger.error('Failed to create schematic loadout', {
			error: error as Error,
			schematicId,
			loadoutName
		});
		throw error;
	}
}

/**
 * Assign a resource to a loadout slot
 */
export function assignResourceToLoadout(
	db: Database,
	schematicId: string,
	loadoutName: string,
	resourceSlotName: string,
	resourceId: number | null,
	resourceName: string | null
): void {
	try {
		const stmt = db.prepare(`
			UPDATE schematic_resource_loadouts 
			SET assigned_resource_id = ?, 
			    assigned_resource_name = ?, 
			    updated_at = datetime('now')
			WHERE schematic_id = ? AND loadout_name = ? AND resource_slot_name = ?
		`);

		const result = stmt.run(resourceId, resourceName, schematicId, loadoutName, resourceSlotName);

		if (result.changes === 0) {
			throw new Error('No loadout slot found to update');
		}

		dbLogger.info('Assigned resource to loadout', {
			schematicId,
			loadoutName,
			resourceSlotName,
			resourceId,
			resourceName
		});
	} catch (error) {
		dbLogger.error('Failed to assign resource to loadout', {
			error: error as Error,
			schematicId,
			loadoutName,
			resourceSlotName
		});
		throw error;
	}
}

/**
 * Delete a loadout
 */
export function deleteSchematicLoadout(
	db: Database,
	schematicId: string,
	loadoutName: string
): void {
	try {
		const stmt = db.prepare(`
			DELETE FROM schematic_resource_loadouts 
			WHERE schematic_id = ? AND loadout_name = ?
		`);

		const result = stmt.run(schematicId, loadoutName);

		dbLogger.info('Deleted schematic loadout', {
			schematicId,
			loadoutName,
			deletedRows: result.changes
		});
	} catch (error) {
		dbLogger.error('Failed to delete schematic loadout', {
			error: error as Error,
			schematicId,
			loadoutName
		});
		throw error;
	}
}

/**
 * Rename a loadout
 */
export function renameSchematicLoadout(
	db: Database,
	schematicId: string,
	oldLoadoutName: string,
	newLoadoutName: string
): void {
	try {
		const stmt = db.prepare(`
			UPDATE schematic_resource_loadouts 
			SET loadout_name = ?, updated_at = datetime('now')
			WHERE schematic_id = ? AND loadout_name = ?
		`);

		const result = stmt.run(newLoadoutName, schematicId, oldLoadoutName);

		if (result.changes === 0) {
			throw new Error('No loadout found to rename');
		}

		dbLogger.info('Renamed schematic loadout', {
			schematicId,
			oldLoadoutName,
			newLoadoutName,
			updatedRows: result.changes
		});
	} catch (error) {
		dbLogger.error('Failed to rename schematic loadout', {
			error: error as Error,
			schematicId,
			oldLoadoutName,
			newLoadoutName
		});
		throw error;
	}
}
