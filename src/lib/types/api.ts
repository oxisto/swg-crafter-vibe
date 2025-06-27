/**
 * API response type definitions for the Star Wars Galaxies shipwright system.
 *
 * Since we're using SvelteKit's native json() and error() functions,
 * success responses return data directly, and errors throw with status codes.
 * These types represent the actual data returned by successful API calls.
 */

import type { InventoryItem, InventoryItemWithTimestamp, Settings } from './inventory.js';
import type { Resource } from './resources.js';
import type { Schematic } from './schematics.js';
import type { ShipLoadout, Chassis } from './ships.js';
import type { MailData, MailImport, Sale } from './sales.js';

// Enhanced inventory items with additional display information
export interface InventoryItemResponse extends InventoryItem {
	displayName?: string;
	schematic?: Schematic;
	schematicId?: string;
}

export interface InventoryItemWithTimestampResponse extends InventoryItemWithTimestamp {
	displayName?: string;
	schematic?: Schematic;
	schematicId?: string;
}

// API Response Types (data returned directly by successful calls)

// Inventory API responses
export type GetInventoryResponse = InventoryItemResponse[];
export type GetInventoryWithTimestampsResponse = InventoryItemWithTimestampResponse[];
export type GetRecentInventoryResponse = InventoryItemWithTimestampResponse[];
export type UpdateInventoryResponse = {
	item: InventoryItemResponse;
	previousQuantity: number;
};

// Settings API responses
export type GetSettingsResponse = Settings;
export type UpdateSettingsResponse = Settings;

// Chassis API responses
export type ListChassisResponse = Chassis[];
export type GetChassisResponse = Chassis;
export type UpdateChassisResponse = Chassis;

// Resources API responses
export type GetResourcesResponse = {
	resources: Resource[];
	total?: number;
	filters?: {
		className?: string;
		searchTerm?: string;
		spawnStatus?: string;
	};
};
export type GetResourceResponse = Resource;

// Schematics API responses
export type GetSchematicsResponse = {
	schematics: Schematic[];
	total?: number;
	filters?: {
		category?: string;
		searchTerm?: string;
		profession?: string;
	};
};
export type GetSchematicResponse = Schematic;
export type UpdateSchematicFavoriteResponse = Schematic;

// Loadouts API responses
export type GetLoadoutsResponse = ShipLoadout[];
export type GetLoadoutResponse = ShipLoadout;
export type UpdateLoadoutResponse = ShipLoadout;
export type CreateLoadoutResponse = ShipLoadout;

// Mail API responses
export type GetMailsResponse = {
	mails: MailData[];
	imports: MailImport[];
	sales: Sale[];
};
export type ImportMailsResponse = {
	imported: number;
	total: number;
	batchId: string;
};

// Chat API responses
export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
}

export type ChatResponse = {
	message: ChatMessage;
	analysis?: {
		totalItems: number;
		totalValue: number;
		lowStockItems: InventoryItemResponse[];
		recommendations: string[];
	};
};

// Common query parameters
export interface PaginationParams {
	page?: number;
	limit?: number;
	offset?: number;
}

export interface SortParams {
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
	searchTerm?: string;
	category?: string;
	status?: string;
}

// Utility type for API endpoints
export type ApiEndpoint<TParams = unknown, TResponse = unknown> = (
	params: TParams
) => Promise<TResponse>;
