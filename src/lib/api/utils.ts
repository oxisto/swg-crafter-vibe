/**
 * API utilities for standardized HTTP requests and error handling.
 * Provides consistent patterns for API responses and error handling across the application.
 * Uses SvelteKit's native json() and error() functions for clean response handling.
 */

import { json, error, type RequestEvent } from '@sveltejs/kit';
import { logger } from '$lib/logger.js';

const apiLogger = logger.child({ component: 'api-utils' });

// HTTP status codes
export const HttpStatus = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Creates a standardized successful API response using SvelteKit's json()
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns JSON response
 */
export function createSuccessResponse<T>(data: T, status: number = HttpStatus.OK) {
	return json(data, { status });
}

/**
 * Creates a standardized error response using SvelteKit's error()
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns SvelteKit error response
 */
export function createErrorResponse(
	message: string | Error,
	status: number = HttpStatus.INTERNAL_SERVER_ERROR
) {
	const errorMessage = message instanceof Error ? message.message : message;

	// Log the error
	apiLogger.error('API Error Response', {
		error: errorMessage,
		status
	});

	return error(status, errorMessage);
}

/**
 * Creates a success response with logging
 * @param data - The response data
 * @param logMessage - Message to log
 * @param logContext - Additional context for logging
 * @param logger - Logger instance to use
 * @param status - HTTP status code (default: 200)
 * @returns JSON response
 */
export function logAndSuccess<T>(
	data: T,
	logMessage: string,
	logContext: Record<string, any> = {},
	logger: any = apiLogger,
	status: number = HttpStatus.OK
) {
	logger.info(logMessage, logContext);
	return json(data, { status });
}

/**
 * Creates an error response with logging
 * @param message - Error message or Error object
 * @param logContext - Additional context for logging
 * @param logger - Logger instance to use
 * @param status - HTTP status code (default: 500)
 * @returns SvelteKit error response
 */
export function logAndError(
	message: string | Error,
	logContext: Record<string, any> = {},
	logger: any = apiLogger,
	status: number = HttpStatus.INTERNAL_SERVER_ERROR
) {
	const errorMessage = message instanceof Error ? message.message : message;

	logger.error(errorMessage, {
		status,
		...logContext
	});

	return error(status, errorMessage);
}

/**
 * Wraps an API handler with standardized error handling
 * @param handler - The API handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends RequestEvent>(
	handler: (event: T) => Promise<Response>
) {
	return async (event: T): Promise<Response> => {
		try {
			return await handler(event);
		} catch (err) {
			// If it's already a SvelteKit error, re-throw it
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}

			// Otherwise, log and create a new error
			apiLogger.error('Unhandled API error', { error: err as Error });
			throw error(
				HttpStatus.INTERNAL_SERVER_ERROR,
				err instanceof Error ? err.message : 'Internal server error'
			);
		}
	};
}

/**
 * Validates required query parameters
 * @param url - The request URL
 * @param requiredParams - Array of required parameter names
 * @returns Object with validation result and parsed parameters
 */
export function validateQueryParams(url: URL, requiredParams: string[]) {
	const params: Record<string, string> = {};
	const missing: string[] = [];

	for (const param of requiredParams) {
		const value = url.searchParams.get(param);
		if (value === null || value === '') {
			missing.push(param);
		} else {
			params[param] = value;
		}
	}

	return {
		isValid: missing.length === 0,
		params,
		missing
	};
}

/**
 * Parses optional query parameters with type conversion
 * @param url - The request URL
 * @param paramConfig - Configuration for each parameter
 * @returns Parsed parameters object
 */
export function parseQueryParams<T extends Record<string, unknown>>(
	url: URL,
	paramConfig: {
		[K in keyof T]: {
			type: 'string' | 'number' | 'boolean' | 'array';
			defaultValue?: T[K];
			required?: boolean;
		};
	}
): { params: Partial<T>; errors: string[] } {
	const params: Partial<T> = {};
	const errors: string[] = [];

	for (const [key, config] of Object.entries(paramConfig)) {
		const rawValue = url.searchParams.get(key);

		if (rawValue === null || rawValue === '') {
			if (config.required) {
				errors.push(`Missing required parameter: ${key}`);
			} else if (config.defaultValue !== undefined) {
				params[key as keyof T] = config.defaultValue;
			}
			continue;
		}

		try {
			switch (config.type) {
				case 'string':
					params[key as keyof T] = rawValue as T[keyof T];
					break;
				case 'number':
					const numValue = parseInt(rawValue, 10);
					if (isNaN(numValue)) {
						errors.push(`Invalid number parameter: ${key}`);
					} else {
						params[key as keyof T] = numValue as T[keyof T];
					}
					break;
				case 'boolean':
					params[key as keyof T] = (rawValue === 'true') as T[keyof T];
					break;
				case 'array':
					params[key as keyof T] = rawValue.split(',').map((s) => s.trim()) as T[keyof T];
					break;
				default:
					errors.push(`Unknown parameter type for: ${key}`);
			}
		} catch (error) {
			errors.push(`Error parsing parameter ${key}: ${error}`);
		}
	}

	return { params, errors };
}

/**
 * Validates and parses JSON request body
 * @param request - The request object
 * @param required - Array of required field names
 * @returns Parsed body and validation result
 */
export async function validateRequestBody<T extends Record<string, unknown>>(
	request: Request,
	required: (keyof T)[] = []
): Promise<{ body: Partial<T>; errors: string[]; isValid: boolean }> {
	const errors: string[] = [];

	try {
		const body = (await request.json()) as Partial<T>;

		// Check required fields
		for (const field of required) {
			if (body[field] === undefined || body[field] === null) {
				errors.push(`Missing required field: ${String(field)}`);
			}
		}

		return {
			body,
			errors,
			isValid: errors.length === 0
		};
	} catch (error) {
		return {
			body: {},
			errors: ['Invalid JSON in request body'],
			isValid: false
		};
	}
}

/**
 * Creates a standardized handler for GET requests with query parameter validation
 * @param config - Configuration for the handler
 * @returns GET request handler
 */
export function createGetHandler<TParams extends Record<string, unknown>, TResponse>(config: {
	queryParams?: {
		[K in keyof TParams]: {
			type: 'string' | 'number' | 'boolean' | 'array';
			defaultValue?: TParams[K];
			required?: boolean;
		};
	};
	handler: (params: Partial<TParams>) => Promise<TResponse>;
	endpoint?: string;
}) {
	return withErrorHandling(async ({ url }) => {
		let params: Partial<TParams> = {};

		if (config.queryParams) {
			const { params: parsedParams, errors } = parseQueryParams(url, config.queryParams);

			if (errors.length > 0) {
				return createErrorResponse(
					`Invalid query parameters: ${errors.join(', ')}`,
					HttpStatus.BAD_REQUEST
				);
			}

			params = parsedParams as Partial<TParams>;
		}

		const data = await config.handler(params);
		return createSuccessResponse(data);
	});
}

/**
 * Creates a standardized handler for POST/PUT requests with body validation
 * @param config - Configuration for the handler
 * @returns POST/PUT request handler
 */
export function createPostHandler<TBody extends Record<string, unknown>, TResponse>(config: {
	requiredFields?: (keyof TBody)[];
	handler: (body: Partial<TBody>) => Promise<TResponse>;
	endpoint?: string;
}) {
	return withErrorHandling(async ({ request }) => {
		const { body, errors, isValid } = await validateRequestBody<TBody>(
			request,
			config.requiredFields
		);

		if (!isValid) {
			return createErrorResponse(
				`Invalid request body: ${errors.join(', ')}`,
				HttpStatus.BAD_REQUEST
			);
		}

		const data = await config.handler(body);
		return createSuccessResponse(data);
	});
}

/**
 * Rate limiting middleware (placeholder for future implementation)
 * @param maxRequests - Maximum requests per time window
 * @param windowMs - Time window in milliseconds
 * @returns Middleware function
 */
export function rateLimit(maxRequests: number, windowMs: number) {
	// This would be implemented with a proper rate limiting store
	// For now, just return a pass-through middleware
	return async (event: RequestEvent, next: () => Promise<Response>) => {
		return next();
	};
}

/**
 * CORS middleware for API endpoints
 * @param options - CORS configuration
 * @returns Response with CORS headers
 */
export function withCors(
	response: Response,
	options?: {
		origin?: string;
		methods?: string[];
		headers?: string[];
	}
) {
	const headers = new Headers(response.headers);

	headers.set('Access-Control-Allow-Origin', options?.origin || '*');
	headers.set(
		'Access-Control-Allow-Methods',
		options?.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'
	);
	headers.set(
		'Access-Control-Allow-Headers',
		options?.headers?.join(', ') || 'Content-Type, Authorization'
	);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
