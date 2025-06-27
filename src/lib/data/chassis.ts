/**
 * @fileoverview Chassis data management for the SWG Shipwright application.
 * Handles chassis database operations, initialization, and CRUD functions.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

import { getDatabase } from './database.js';
import { SHIP_CHASSIS } from '$lib/types.js';
import { logger } from '$lib/logger.js';
import type { Chassis } from '$lib/types/ships.js';

const chassisLogger = logger.child({ component: 'data', module: 'chassis' });

/**
 * Initialize chassis table and populate with default data
 */
export function initializeChassisDefaults() {
	try {
		const db = getDatabase();

		// Create chassis table if it doesn't exist
		db.exec(`
			CREATE TABLE IF NOT EXISTS chassis (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				shipType TEXT NOT NULL,
				variant TEXT,
				price INTEGER NOT NULL,
				quantity INTEGER NOT NULL DEFAULT 0,
				schematicId TEXT,
				description TEXT,
				updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// Check if we need to populate with default data
		const existingChassis = db.prepare('SELECT COUNT(*) as count FROM chassis').get() as {
			count: number;
		};

		if (existingChassis.count === 0) {
			chassisLogger.info('Initializing chassis table with default data');

			const insertChassis = db.prepare(`
				INSERT INTO chassis (id, name, shipType, variant, price, quantity, description)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`);

			for (const chassis of SHIP_CHASSIS) {
				insertChassis.run(
					chassis.id,
					chassis.name,
					chassis.shipType,
					chassis.variant || null,
					chassis.price,
					chassis.quantity,
					chassis.description || null
				);
			}

			chassisLogger.info('Chassis table initialized successfully', { count: SHIP_CHASSIS.length });
		} else {
			chassisLogger.debug('Chassis table already exists with data', {
				count: existingChassis.count
			});
		}
	} catch (error) {
		chassisLogger.error('Failed to initialize chassis table', { error: error as Error });
		throw error;
	}
}

/**
 * Get all chassis ordered by shipType, variant, and name
 */
export function getAllChassis(): Chassis[] {
	try {
		const db = getDatabase();
		const chassis = db
			.prepare(
				`
			SELECT * FROM chassis 
			ORDER BY shipType, variant, name
		`
			)
			.all() as Chassis[];

		chassisLogger.debug('Retrieved all chassis', { count: chassis.length });
		return chassis;
	} catch (error) {
		chassisLogger.error('Failed to get all chassis', { error: error as Error });
		throw error;
	}
}

/**
 * Get a specific chassis by ID
 */
export function getChassisById(id: string): Chassis | null {
	try {
		const db = getDatabase();
		const chassis = db.prepare('SELECT * FROM chassis WHERE id = ?').get(id) as Chassis | undefined;

		if (chassis) {
			chassisLogger.debug('Retrieved chassis by ID', { id });
			return chassis;
		} else {
			chassisLogger.warn('Chassis not found', { id });
			return null;
		}
	} catch (error) {
		chassisLogger.error('Failed to get chassis by ID', { id, error: error as Error });
		throw error;
	}
}

/**
 * Update chassis quantity
 */
export function updateChassisQuantity(id: string, quantity: number): Chassis | null {
	try {
		const db = getDatabase();

		const updateChassis = db.prepare(`
			UPDATE chassis 
			SET quantity = ?, updatedAt = CURRENT_TIMESTAMP 
			WHERE id = ?
		`);

		const result = updateChassis.run(quantity, id);

		if (result.changes === 0) {
			chassisLogger.warn('Chassis not found for update', { id, quantity });
			return null;
		}

		const updatedChassis = db.prepare('SELECT * FROM chassis WHERE id = ?').get(id) as Chassis;
		chassisLogger.info('Updated chassis quantity', { id, quantity });
		return updatedChassis;
	} catch (error) {
		chassisLogger.error('Failed to update chassis quantity', {
			id,
			quantity,
			error: error as Error
		});
		throw error;
	}
}
