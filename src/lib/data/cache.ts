/**
 * Cache Management Module
 *
 * Provides utilities for managing cache timestamps and checking cache freshness.
 */

import { getDatabase } from './database.js';

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
	SCHEMATICS: {
		CACHE_KEY: 'schematics_last_update',
		DURATION_HOURS: 24,
		TABLE: 'schematics_cache'
	},
	RESOURCES: {
		CACHE_KEY: 'resources_last_update',
		DURATION_HOURS: 6,
		TABLE: 'resources_cache'
	}
} as const;

/**
 * Checks if a cache is fresh (within the specified duration)
 * @param cacheKey - The cache key to check
 * @param tableName - The cache table name
 * @param durationHours - Cache duration in hours
 * @returns Object with cache status and age information
 */
export function checkCacheStatus(
	cacheKey: string,
	tableName: string,
	durationHours: number
): {
	isFresh: boolean;
	hoursOld: number;
	needsUpdate: boolean;
	lastUpdate?: Date;
} {
	const db = getDatabase();
	const lastUpdate = db.prepare(`SELECT value FROM ${tableName} WHERE key = ?`).get(cacheKey) as
		| { value: string }
		| undefined;

	if (!lastUpdate) {
		return {
			isFresh: false,
			hoursOld: Infinity,
			needsUpdate: true
		};
	}

	const lastUpdateTime = new Date(lastUpdate.value);
	const now = new Date();
	const hoursOld = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
	const isFresh = hoursOld < durationHours;

	return {
		isFresh,
		hoursOld,
		needsUpdate: !isFresh,
		lastUpdate: lastUpdateTime
	};
}

/**
 * Updates a cache timestamp
 * @param cacheKey - The cache key to update
 * @param tableName - The cache table name
 * @param timestamp - The timestamp to store (defaults to current time)
 */
export function updateCacheTimestamp(
	cacheKey: string,
	tableName: string,
	timestamp: Date = new Date()
): void {
	const db = getDatabase();
	const stmt = db.prepare(`
		INSERT INTO ${tableName} (key, value, updated_at) 
		VALUES (?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(key) DO UPDATE SET 
			value = excluded.value,
			updated_at = CURRENT_TIMESTAMP
	`);
	stmt.run(cacheKey, timestamp.toISOString());
}

/**
 * Deletes a cache entry
 * @param cacheKey - The cache key to delete
 * @param tableName - The cache table name
 */
export function deleteCacheEntry(cacheKey: string, tableName: string): void {
	const db = getDatabase();
	const stmt = db.prepare(`DELETE FROM ${tableName} WHERE key = ?`);
	stmt.run(cacheKey);
}

/**
 * Gets all cache entries for a table
 * @param tableName - The cache table name
 * @returns Array of cache entries
 */
export function getAllCacheEntries(tableName: string): Array<{
	key: string;
	value: string;
	updated_at: string;
}> {
	const db = getDatabase();
	const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`);
	return stmt.all() as Array<{
		key: string;
		value: string;
		updated_at: string;
	}>;
}
