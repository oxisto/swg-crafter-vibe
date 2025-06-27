/**
 * API utilities for standardized HTTP requests and error handling.
 * Provides consistent patterns for API responses and error handling across the application.
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { logger } from '$lib/logger.js';
import type { ApiResponse, ApiError } from '$lib/types/api.js';

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
 * Creates a standardized successful API response
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with success format
 */
export function createSuccessResponse<T>(data: T, status: number = HttpStatus.OK) {
	const response: ApiResponse<T> = {
		success: true,
		data
	};
	return json(response, { status });
}

/**
 * Creates a standardized error API response
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code
 * @param details - Optional error details
 * @returns JSON response with error format
 */
export function createErrorResponse(
	error: string | Error,
	status: number = HttpStatus.INTERNAL_SERVER_ERROR,
	code?: string,
	details?: Record<string, unknown>
) {
	const errorMessage = error instanceof Error ? error.message : error;
	const response: ApiError = {
		success: false,
		error: errorMessage,
		code,
		details
	};

	// Log the error
	apiLogger.error('API Error Response', {
		error: errorMessage,
		status,
		code,
		details
	});

	return json(response, { status });
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
		} catch (error) {
			apiLogger.error('Unhandled API error', { error: error as Error });
			return createErrorResponse(
				error instanceof Error ? error : 'Internal server error',
				HttpStatus.INTERNAL_SERVER_ERROR
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
