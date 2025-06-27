/**
 * Legacy type definitions file - now re-exports from modular type structure.
 *
 * @deprecated This file is maintained for backward compatibility.
 * New code should import types directly from the appropriate modules:
 * - `$lib/types/inventory` for inventory-related types
 * - `$lib/types/schematics` for schematic-related types
 * - `$lib/types/resources` for resource-related types
 * - `$lib/types/ships` for ship and loadout-related types
 * - `$lib/types/sales` for sales and mail-related types
 * - `$lib/types` for the main consolidated export
 */

// Re-export everything from the new modular structure
export * from './types/index.js';
