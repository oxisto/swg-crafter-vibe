import { initializeDataLayer } from '$lib/data';
import { setServerLogger, requestLogger } from '$lib/logger.js';
import type { Handle } from '@sveltejs/kit';
import pino from 'pino';
import { dev } from '$app/environment';

// Initialize Pino logger
const pinoLogger = pino({
	level: dev ? 'debug' : 'info',
	transport: dev
		? {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'SYS:standard',
					ignore: 'pid,hostname'
				}
			}
		: undefined
});

// Set the server logger for the logging system
setServerLogger(pinoLogger);

// Initialize database on server startup
try {
	initializeDataLayer();
	pinoLogger.info('Database initialized successfully');
} catch (error) {
	pinoLogger.fatal({ error }, 'Failed to initialize database');
	process.exit(1);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Generate request ID for correlation
	const requestId = crypto.randomUUID();

	// Create request logger
	const reqLogger = requestLogger(requestId, event.request.method, event.url.pathname);

	// Add logger to event locals for use in API routes
	event.locals.logger = reqLogger;

	const startTime = Date.now();

	try {
		const response = await resolve(event);

		// Only log errors and important operations
		if (response.status >= 400) {
			reqLogger.error(
				`Request failed: ${response.status} ${event.request.method} ${event.url.pathname} (${Date.now() - startTime}ms)`
			);
		}

		return response;
	} catch (error) {
		reqLogger.error(
			`Request error: ${event.request.method} ${event.url.pathname} (${Date.now() - startTime}ms)`,
			{ error: error as Error }
		);
		throw error;
	}
};
