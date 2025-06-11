import { cleanupSOAPCache, getSOAPCacheStats } from '$lib/database.js';

/**
 * Background task to cleanup expired SOAP cache entries
 * Can be called from a cron job or scheduled task
 */
export async function runCacheCleanup(): Promise<{
	cleaned: number;
	stats: ReturnType<typeof getSOAPCacheStats>;
}> {
	console.log('Starting SOAP cache cleanup...');

	const statsBefore = getSOAPCacheStats();
	const cleaned = cleanupSOAPCache();
	const statsAfter = getSOAPCacheStats();

	console.log(`SOAP cache cleanup completed: ${cleaned} expired entries removed`);
	console.log(`Cache stats - Before: ${statsBefore.total} total, After: ${statsAfter.total} total`);

	return {
		cleaned,
		stats: statsAfter
	};
}

/**
 * Scheduled cache cleanup that runs every hour
 * Only cleanup if there are more than 10 expired entries
 */
export function schedulePeriodicCacheCleanup(): void {
	const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
	const MIN_EXPIRED_THRESHOLD = 10;

	setInterval(() => {
		const stats = getSOAPCacheStats();

		if (stats.expired >= MIN_EXPIRED_THRESHOLD) {
			runCacheCleanup().catch((error) => {
				console.error('Background cache cleanup failed:', error);
			});
		} else {
			console.log(
				`Skipping cache cleanup: only ${stats.expired} expired entries (threshold: ${MIN_EXPIRED_THRESHOLD})`
			);
		}
	}, CLEANUP_INTERVAL_MS);

	console.log('Scheduled periodic SOAP cache cleanup every hour');
}
