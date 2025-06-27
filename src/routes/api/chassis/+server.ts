import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/data/database.js';
import { SHIP_CHASSIS } from '$lib/types.js';
import { HttpStatus, logAndSuccess, logAndError } from '$lib/api/utils.js';
import { logger } from '$lib/logger.js';
import type { RequestHandler } from './$types.js';
import type { Chassis } from '$lib/types/ships.js';
import type { GetChassisResponse, UpdateChassisResponse } from '$lib/types/api.js';

const chassisLogger = logger.child({ component: 'api', endpoint: 'chassis' });

// Ensure chassis table exists and is populated
function initializeChassisTable() {
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
	}
}

export const GET: RequestHandler = async (): Promise<Response> => {
	try {
		initializeChassisTable();

		const db = getDatabase();
		const chassis = db
			.prepare(
				`
			SELECT * FROM chassis 
			ORDER BY shipType, variant, name
		`
			)
			.all() as Chassis[];

		return logAndSuccess(
			chassis satisfies GetChassisResponse,
			'Successfully fetched chassis data',
			{ count: chassis.length },
			chassisLogger
		);
	} catch (err) {
		return logAndError(
			'Error fetching chassis data',
			{ error: err as Error },
			chassisLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};

export const PATCH: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		const { id, quantity } = await request.json();

		if (!id || quantity === undefined || quantity < 0) {
			return logAndError(
				'Invalid chassis ID or quantity',
				{ id, quantity },
				chassisLogger,
				HttpStatus.BAD_REQUEST
			);
		}

		initializeChassisTable();
		const db = getDatabase();

		const updateChassis = db.prepare(`
			UPDATE chassis 
			SET quantity = ?, updatedAt = CURRENT_TIMESTAMP 
			WHERE id = ?
		`);

		const result = updateChassis.run(quantity, id);

		if (result.changes === 0) {
			return logAndError(
				'Chassis not found',
				{ id, quantity },
				chassisLogger,
				HttpStatus.NOT_FOUND
			);
		}

		const updatedChassis = db.prepare('SELECT * FROM chassis WHERE id = ?').get(id) as Chassis;

		return logAndSuccess(
			updatedChassis satisfies UpdateChassisResponse,
			'Successfully updated chassis',
			{ id, quantity },
			chassisLogger
		);
	} catch (err) {
		return logAndError(
			'Error updating chassis',
			{ error: err as Error },
			chassisLogger,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}
};
