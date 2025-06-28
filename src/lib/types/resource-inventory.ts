/**
 * Resource Inventory Constants
 *
 * Contains resource inventory amount definitions and configurations
 * that can be safely imported in both client and server code.
 */

import type { ResourceInventoryAmount } from './resources.js';

/**
 * Resource inventory amount definitions
 */
export const RESOURCE_INVENTORY_AMOUNTS = {
	none: {
		value: 'none' as const,
		label: 'None',
		description: '0 units',
		color: 'gray',
		sortOrder: 0
	},
	very_low: {
		value: 'very_low' as const,
		label: 'Very Low',
		description: '< 10k units',
		color: 'red',
		sortOrder: 1
	},
	low: {
		value: 'low' as const,
		label: 'Low',
		description: '10k - 100k units',
		color: 'orange',
		sortOrder: 2
	},
	medium: {
		value: 'medium' as const,
		label: 'Medium',
		description: '100k - 1M units',
		color: 'yellow',
		sortOrder: 3
	},
	high: {
		value: 'high' as const,
		label: 'High',
		description: '> 1M units',
		color: 'green',
		sortOrder: 4
	}
} as const;

export type ResourceInventoryAmountConfig =
	(typeof RESOURCE_INVENTORY_AMOUNTS)[ResourceInventoryAmount];
