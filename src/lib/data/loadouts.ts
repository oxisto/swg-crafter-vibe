/**
 * Ship Loadouts Data Module
 *
 * Handles all ship loadout-related database operations including CRUD operations,
 * pricing management, and inventory tracking for complete ship loadouts.
 */

import {
	SHIP_LOADOUTS,
	getLoadoutKey,
	type ShipLoadout,
	type ShipType,
	type MarkLevel
} from '../types.js';
import { getDatabase } from './database.js';

/**
 * Initializes loadouts with default values if empty
 */
export function initializeLoadoutDefaults() {
	const db = getDatabase();
	const count = db.prepare('SELECT COUNT(*) as count FROM ship_loadouts').get() as {
		count: number;
	};

	if (count.count === 0) {
		const insert = db.prepare(`
      INSERT INTO ship_loadouts (id, name, ship_type, variant, mark_level, price, quantity, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

		const insertMany = db.transaction(() => {
			for (const loadout of SHIP_LOADOUTS) {
				insert.run(
					loadout.id,
					loadout.name,
					loadout.shipType,
					loadout.variant,
					loadout.markLevel,
					loadout.price,
					loadout.quantity,
					loadout.description
				);
			}
		});

		insertMany();
	}
}

/**
 * Retrieves all ship loadouts from the database.
 * @returns Array of all ship loadouts
 */
export function getAllLoadouts(): ShipLoadout[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			`
		SELECT id, name, ship_type, variant, mark_level, price, quantity, schematic_id, description, updated_at 
		FROM ship_loadouts 
		ORDER BY ship_type, variant, mark_level
	`
		)
		.all() as Array<{
		id: string;
		name: string;
		ship_type: string;
		variant: string | null;
		mark_level: string;
		price: number;
		quantity: number;
		schematic_id: string | null;
		description: string | null;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		shipType: row.ship_type as ShipType,
		variant: row.variant || undefined,
		markLevel: row.mark_level as MarkLevel,
		price: row.price,
		quantity: row.quantity,
		schematicId: row.schematic_id || undefined,
		description: row.description || undefined,
		updatedAt: row.updated_at
	}));
}

/**
 * Updates the quantity of a specific loadout.
 * @param id - The loadout ID
 * @param quantity - The new quantity value
 */
export function updateLoadoutQuantity(id: string, quantity: number): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    UPDATE ship_loadouts 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);

	stmt.run(quantity, id);
}

/**
 * Updates the price of a specific loadout.
 * @param id - The loadout ID
 * @param price - The new price value
 */
export function updateLoadoutPrice(id: string, price: number): void {
	const db = getDatabase();
	const stmt = db.prepare(`
    UPDATE ship_loadouts 
    SET price = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);

	stmt.run(price, id);
}

/**
 * Retrieves a specific loadout by ID.
 * @param id - The loadout ID
 * @returns The loadout or null if not found
 */
export function getLoadoutById(id: string): ShipLoadout | null {
	const db = getDatabase();
	const stmt = db.prepare(`
		SELECT id, name, ship_type, variant, mark_level, price, quantity, schematic_id, description, updated_at 
		FROM ship_loadouts 
		WHERE id = ?
	`);
	const row = stmt.get(id) as
		| {
				id: string;
				name: string;
				ship_type: string;
				variant: string | null;
				mark_level: string;
				price: number;
				quantity: number;
				schematic_id: string | null;
				description: string | null;
				updated_at: string;
		  }
		| undefined;

	if (!row) return null;

	return {
		id: row.id,
		name: row.name,
		shipType: row.ship_type as ShipType,
		variant: row.variant || undefined,
		markLevel: row.mark_level as MarkLevel,
		price: row.price,
		quantity: row.quantity,
		schematicId: row.schematic_id || undefined,
		description: row.description || undefined,
		updatedAt: row.updated_at
	};
}

/**
 * Creates a new ship loadout.
 * @param loadout - The loadout data
 * @returns The created loadout ID
 */
export function createLoadout(loadout: Omit<ShipLoadout, 'updatedAt'>): string {
	const db = getDatabase();
	const stmt = db.prepare(`
    INSERT INTO ship_loadouts (id, name, ship_type, variant, mark_level, price, quantity, schematic_id, description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

	stmt.run(
		loadout.id,
		loadout.name,
		loadout.shipType,
		loadout.variant || null,
		loadout.markLevel,
		loadout.price,
		loadout.quantity,
		loadout.schematicId || null,
		loadout.description || null
	);

	return loadout.id;
}

/**
 * Deletes a ship loadout.
 * @param id - The loadout ID to delete
 */
export function deleteLoadout(id: string): void {
	const db = getDatabase();
	const stmt = db.prepare('DELETE FROM ship_loadouts WHERE id = ?');
	stmt.run(id);
}

/**
 * Gets loadouts for a specific ship type.
 * @param shipType - The ship type to filter by
 * @returns Array of loadouts for the specified ship type
 */
export function getLoadoutsByShipType(shipType: ShipType): ShipLoadout[] {
	const db = getDatabase();
	const stmt = db.prepare(`
		SELECT id, name, ship_type, variant, mark_level, price, quantity, schematic_id, description, updated_at 
		FROM ship_loadouts 
		WHERE ship_type = ?
		ORDER BY variant, mark_level
	`);
	const rows = stmt.all(shipType) as Array<{
		id: string;
		name: string;
		ship_type: string;
		variant: string | null;
		mark_level: string;
		price: number;
		quantity: number;
		schematic_id: string | null;
		description: string | null;
		updated_at: string;
	}>;

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		shipType: row.ship_type as ShipType,
		variant: row.variant || undefined,
		markLevel: row.mark_level as MarkLevel,
		price: row.price,
		quantity: row.quantity,
		schematicId: row.schematic_id || undefined,
		description: row.description || undefined,
		updatedAt: row.updated_at
	}));
}
