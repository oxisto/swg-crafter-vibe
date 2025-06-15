import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/data/database.js';
import { SHIP_CHASSIS } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

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

export const GET: RequestHandler = async () => {
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
			.all();

		return json(chassis);
	} catch (error) {
		console.error('Error fetching chassis:', error);
		return json({ error: 'Failed to fetch chassis' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { id, quantity } = await request.json();

		if (!id || quantity === undefined || quantity < 0) {
			return json({ error: 'Invalid chassis ID or quantity' }, { status: 400 });
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
			return json({ error: 'Chassis not found' }, { status: 404 });
		}

		const updatedChassis = db.prepare('SELECT * FROM chassis WHERE id = ?').get(id);
		return json(updatedChassis);
	} catch (error) {
		console.error('Error updating chassis:', error);
		return json({ error: 'Failed to update chassis' }, { status: 500 });
	}
};
