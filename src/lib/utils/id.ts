/**
 * Utility functions for generating unique IDs
 */

let idCounter = 0;

/**
 * Generates a unique ID for form elements
 */
export function generateId(prefix: string = 'input'): string {
	return `${prefix}-${++idCounter}-${Math.random().toString(36).substr(2, 9)}`;
}
