/**
 * Unified logging system for SWG Shipwright application
 * Provides structured logging for both server and client environments
 */

import type { Logger as PinoLogger } from 'pino';

// Log levels (matching Pino levels)
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Log context interface for structured logging
export interface LogContext {
	[key: string]: any;
	userId?: string;
	requestId?: string;
	component?: string;
	action?: string;
	duration?: number;
	error?: Error | string;
}

// Unified logger interface
export interface Logger {
	trace(message: string, context?: LogContext): void;
	debug(message: string, context?: LogContext): void;
	info(message: string, context?: LogContext): void;
	warn(message: string, context?: LogContext): void;
	error(message: string, context?: LogContext): void;
	fatal(message: string, context?: LogContext): void;
	child(context: LogContext): Logger;
}

// Server-side Pino logger instance (set in hooks.server.ts)
let serverLogger: PinoLogger | null = null;

/**
 * Set the server logger instance (called from hooks.server.ts)
 */
export function setServerLogger(logger: PinoLogger): void {
	serverLogger = logger;
}

/**
 * Client-side logger implementation
 */
class ClientLogger implements Logger {
	private context: LogContext;

	constructor(context: LogContext = {}) {
		this.context = context;
	}

	private log(level: LogLevel, message: string, context: LogContext = {}): void {
		const logData = { ...this.context, ...context };
		const timestamp = new Date().toISOString();

		// Format log message for console
		const contextStr = Object.keys(logData).length > 0 ? ` | ${JSON.stringify(logData)}` : '';

		const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;

		// Use appropriate console method based on level
		switch (level) {
			case 'trace':
			case 'debug':
				console.debug(logMessage);
				break;
			case 'info':
				console.info(logMessage);
				break;
			case 'warn':
				console.warn(logMessage);
				break;
			case 'error':
			case 'fatal':
				console.error(logMessage);
				if (context.error instanceof Error) {
					console.error(context.error);
				}
				break;
		}

		// Optional: Send to remote logging service in production
		if (typeof window !== 'undefined' && import.meta.env.PROD) {
			this.sendToRemoteLogger(level, message, logData);
		}
	}

	private async sendToRemoteLogger(
		level: LogLevel,
		message: string,
		context: LogContext
	): Promise<void> {
		try {
			// Example: Send to your preferred logging service
			// await fetch('/api/logs', {
			// 	method: 'POST',
			// 	headers: { 'Content-Type': 'application/json' },
			// 	body: JSON.stringify({ level, message, context, timestamp: new Date().toISOString() })
			// });
		} catch (error) {
			// Silently fail - don't break the app for logging issues
			console.error('Failed to send log to remote service:', error);
		}
	}

	trace(message: string, context?: LogContext): void {
		this.log('trace', message, context);
	}

	debug(message: string, context?: LogContext): void {
		this.log('debug', message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log('info', message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log('warn', message, context);
	}

	error(message: string, context?: LogContext): void {
		this.log('error', message, context);
	}

	fatal(message: string, context?: LogContext): void {
		this.log('fatal', message, context);
	}

	child(context: LogContext): Logger {
		return new ClientLogger({ ...this.context, ...context });
	}
}

/**
 * Server-side logger wrapper
 */
class ServerLoggerWrapper implements Logger {
	private context: LogContext;

	constructor(context: LogContext = {}) {
		this.context = context;
	}

	private getLogger(): PinoLogger {
		if (!serverLogger) {
			throw new Error('Server logger not initialized. Call setServerLogger() in hooks.server.ts');
		}
		return serverLogger;
	}

	trace(message: string, context?: LogContext): void {
		this.getLogger().trace({ ...this.context, ...context }, message);
	}

	debug(message: string, context?: LogContext): void {
		this.getLogger().debug({ ...this.context, ...context }, message);
	}

	info(message: string, context?: LogContext): void {
		this.getLogger().info({ ...this.context, ...context }, message);
	}

	warn(message: string, context?: LogContext): void {
		this.getLogger().warn({ ...this.context, ...context }, message);
	}

	error(message: string, context?: LogContext): void {
		this.getLogger().error({ ...this.context, ...context }, message);
	}

	fatal(message: string, context?: LogContext): void {
		this.getLogger().fatal({ ...this.context, ...context }, message);
	}

	child(context: LogContext): Logger {
		return new ServerLoggerWrapper({ ...this.context, ...context });
	}
}

/**
 * Create a logger instance (automatically detects environment)
 */
export function createLogger(context: LogContext = {}): Logger {
	// Check if we're in a server environment
	if (typeof window === 'undefined' && serverLogger) {
		return new ServerLoggerWrapper(context);
	}

	// Client-side or server without Pino
	return new ClientLogger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
	private startTime: number;
	private logger: Logger;
	private operation: string;
	private context: LogContext;

	constructor(operation: string, logger: Logger = createLogger(), context: LogContext = {}) {
		this.startTime = Date.now();
		this.operation = operation;
		this.logger = logger;
		this.context = context;

		this.logger.debug(`Starting ${operation}`, this.context);
	}

	end(additionalContext: LogContext = {}): number {
		const duration = Date.now() - this.startTime;

		this.logger.info(`Completed ${this.operation}`, {
			...this.context,
			...additionalContext,
			duration
		});

		return duration;
	}

	endWithError(error: Error, additionalContext: LogContext = {}): number {
		const duration = Date.now() - this.startTime;

		this.logger.error(`Failed ${this.operation}`, {
			...this.context,
			...additionalContext,
			duration,
			error
		});

		return duration;
	}
}

/**
 * Convenience function to measure async operations
 */
export async function measureAsync<T>(
	operation: string,
	fn: () => Promise<T>,
	logger: Logger = createLogger(),
	context: LogContext = {}
): Promise<T> {
	const timer = new PerformanceTimer(operation, logger, context);

	try {
		const result = await fn();
		timer.end({ success: true });
		return result;
	} catch (error) {
		timer.endWithError(error as Error);
		throw error;
	}
}

/**
 * Express/SvelteKit request logging middleware helper
 */
export function requestLogger(requestId: string, method: string, url: string): Logger {
	return createLogger({
		requestId,
		method,
		url,
		component: 'request'
	});
}
