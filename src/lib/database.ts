/**
 * Star Wars Galaxies Shipwright Database Module (Legacy Compatibility Layer)
 *
 * This module provides backward compatibility for the old database.ts interface.
 * All functionality has been moved to the new modular data layer in /lib/data/.
 *
 * @deprecated Use the new data layer modules directly from /lib/data/
 */

// Re-export everything from the new data layer for backward compatibility
export * from './data/index.js';

// For backward compatibility, also export the main initialization function
// as the old initDatabase name (it now calls initializeDataLayer internally)
export { initializeDataLayer as initDatabase } from './data/index.js';
