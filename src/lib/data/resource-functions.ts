/**
 * Resource Class Functions
 *
 * Simple interface for getting resource class information directly from the database.
 * No Node.js dependencies - safe for both server and client use.
 */

import { getDatabase } from './database.js';

export interface ResourceClassInfo {
	name: string;
	category?: string;
	description?: string;
	path?: string;
}

interface ResourceClassDBRecord {
	id: number;
	swgcraft_id: string;
	swgID: number;
	name: string;
	parent_id: string | null;
	depth: number;
	created_at: string;
	updated_at: string;
}

/**
 * Get resource class info directly from the database
 */
function getResourceClassFromDB(swgcraftId: string): ResourceClassDBRecord | null {
	try {
		const db = getDatabase();
		return (
			(db.prepare('SELECT * FROM resource_classes WHERE swgcraft_id = ?').get(swgcraftId) as
				| ResourceClassDBRecord
				| undefined) || null
		);
	} catch (error) {
		console.warn(`Database lookup failed for ${swgcraftId}:`, error);
		return null;
	}
}

/**
 * Get the full path of a resource class (from root to this class)
 */
function getResourceClassPath(swgcraftId: string): string[] {
	try {
		const db = getDatabase();
		const path: string[] = [];
		let currentId = swgcraftId;

		while (currentId) {
			const record = db
				.prepare('SELECT name, parent_id FROM resource_classes WHERE swgcraft_id = ?')
				.get(currentId) as { name: string; parent_id: string | null } | undefined;

			if (!record) break;

			path.unshift(record.name);
			currentId = record.parent_id || '';
		}

		return path;
	} catch (error) {
		console.warn(`Path lookup failed for ${swgcraftId}:`, error);
		return [];
	}
}

/**
 * Get detailed resource class information including path
 */
export function getResourceClassDetails(classCode: string): ResourceClassInfo | null {
	try {
		const record = getResourceClassFromDB(classCode);
		if (!record) return null;

		const path = getResourceClassPath(classCode);
		const category = path.length > 1 ? path[1] : undefined;

		return {
			name: record.name,
			category,
			path: path.join(' > ')
		};
	} catch (error) {
		console.warn(`Details lookup failed for ${classCode}:`, error);
		return null;
	}
}

/**
 * Get display name for a resource class code
 */
export function getResourceDisplayName(classCode: string): string {
	const info = getResourceClassDetails(classCode);
	return info?.name || classCode.toUpperCase();
}

/**
 * Get human-readable information for a resource class code
 */
export function getResourceClassInfo(code: string): ResourceClassInfo {
	const info = getResourceClassDetails(code);

	if (info) {
		return info;
	}

	// Fallback for unknown codes
	return {
		name: code.toUpperCase(),
		category: 'Unknown',
		description: `Resource class ${code} (not in database)`
	};
}

/**
 * Get just the class name for a resource code
 */
export function getResourceClassName(code: string): string {
	return getResourceDisplayName(code);
}

/**
 * Get the category name for a resource code
 */
export function getResourceClassCategory(code: string): string {
	const info = getResourceClassDetails(code);
	return info?.category || 'Unknown';
}

/**
 * Format multiple resource class codes into a readable string
 */
export function formatResourceClasses(codes: string[]): string {
	return codes.map((code) => getResourceDisplayName(code)).join(', ');
}

/**
 * Get the full path of a resource class as swgcraft_ids (from root to this class)
 */
export function getResourceClassIdPath(swgcraftId: string): string[] {
	try {
		const db = getDatabase();
		const path: string[] = [];
		let currentId = swgcraftId;

		while (currentId) {
			const record = db
				.prepare('SELECT name, parent_id FROM resource_classes WHERE swgcraft_id = ?')
				.get(currentId) as { name: string; parent_id: string | null } | undefined;

			if (!record) break;

			path.unshift(currentId); // Store the swgcraft_id instead of name
			currentId = record.parent_id || '';
		}

		return path;
	} catch (error) {
		console.warn(`ID path lookup failed for ${swgcraftId}:`, error);
		return [];
	}
}

/**
 * Look up resource class information by name
 * @param name - The resource class name (e.g. "Phrik Aluminum", "Energy", etc.)
 * @returns Resource class info or null if not found
 */
export function getResourceClassByName(
	name: string
): { swgcraft_id: string; name: string; parent_id: string | null } | null {
	try {
		const db = getDatabase();
		const result = db
			.prepare('SELECT swgcraft_id, name, parent_id FROM resource_classes WHERE name = ?')
			.get(name) as { swgcraft_id: string; name: string; parent_id: string | null } | undefined;
		return result || null;
	} catch (error) {
		console.warn(`Failed to lookup resource class for name ${name}:`, error);
		return null;
	}
}

/**
 * Get proper class path for a resource type name (e.g. "Phrik Aluminum")
 * This function looks up the resource class by name and returns the proper swgcraft_id path
 * @param typeName - The resource type name
 * @returns Array of swgcraft_ids from root to leaf, or empty array if not found
 */
export function getProperClassPathForType(typeName: string): string[] {
	try {
		const resourceClass = getResourceClassByName(typeName);
		if (!resourceClass) {
			console.warn(`Resource class not found for type: ${typeName}`);
			return [];
		}

		return getResourceClassIdPath(resourceClass.swgcraft_id);
	} catch (error) {
		console.warn(`Failed to get proper class path for type ${typeName}:`, error);
		return [];
	}
}
