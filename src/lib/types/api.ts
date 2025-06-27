/**
 * API response type definitions for the Star Wars Galaxies shipwright system.
 * Contains standardized response types for all API endpoints.
 */

import type { InventoryItem, InventoryItemWithTimestamp, Settings } from './inventory.js';
import type { Resource } from './resources.js';
import type { Schematic } from './schematics.js';
import type { ShipLoadout, Chassis } from './ships.js';
import type { MailData, MailImport, Sale } from './sales.js';

// Base API response wrapper
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Standardized error response
export interface ApiError {
	success: false;
	error: string;
	code?: string;
	details?: Record<string, unknown>;
}

// Inventory API responses
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

export interface GetInventoryResponse extends ApiResponse {
	success: true;
	inventory: InventoryItemResponse[];
}

export interface GetInventoryWithTimestampsResponse extends ApiResponse {
	success: true;
	inventory: InventoryItemWithTimestampResponse[];
}

export interface GetRecentInventoryResponse extends ApiResponse {
	success: true;
	recentUpdates: InventoryItemWithTimestampResponse[];
}

export interface UpdateInventoryResponse extends ApiResponse {
	success: true;
	item: InventoryItemResponse;
	previousQuantity: number;
}

// Settings API responses
export interface GetSettingsResponse extends ApiResponse {
	success: true;
	settings: Settings;
}

export interface UpdateSettingsResponse extends ApiResponse {
	success: true;
	settings: Settings;
}

// Resources API responses
export interface GetResourcesResponse extends ApiResponse {
	success: true;
	resources: Resource[];
	total?: number;
	filters?: {
		className?: string;
		searchTerm?: string;
		spawnStatus?: string;
	};
}

export interface GetResourceResponse extends ApiResponse {
	success: true;
	resource: Resource;
}

// Schematics API responses
export interface GetSchematicsResponse extends ApiResponse {
	success: true;
	schematics: Schematic[];
	total?: number;
	filters?: {
		category?: string;
		searchTerm?: string;
		profession?: string;
	};
}

export interface GetSchematicResponse extends ApiResponse {
	success: true;
	schematic: Schematic;
}

export interface UpdateSchematicFavoriteResponse extends ApiResponse {
	success: true;
	schematic: Schematic;
}

// Loadouts API responses
export interface GetLoadoutsResponse extends ApiResponse {
	success: true;
	loadouts: ShipLoadout[];
	chassis: Chassis[];
}

export interface UpdateLoadoutResponse extends ApiResponse {
	success: true;
	loadout: ShipLoadout;
}

export interface UpdateChassisResponse extends ApiResponse {
	success: true;
	chassis: Chassis;
}

// Mail API responses
export interface GetMailsResponse extends ApiResponse {
	success: true;
	mails: MailData[];
	imports: MailImport[];
	sales: Sale[];
}

export interface ImportMailsResponse extends ApiResponse {
	success: true;
	imported: number;
	total: number;
	batchId: string;
}

// Chat API responses
export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
}

export interface ChatResponse extends ApiResponse<ChatMessage> {
	success: true;
	data: ChatMessage;
	analysis?: {
		totalItems: number;
		totalValue: number;
		lowStockItems: InventoryItemResponse[];
		recommendations: string[];
	};
}

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
export type ApiEndpoint<TParams = unknown, TResponse = ApiResponse> = (
	params: TParams
) => Promise<TResponse>;
