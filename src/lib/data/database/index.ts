/**
 * Database Module
 *
 * Main entry point for database functionality. This module provides
 * the same interface as the original database.ts but with a modular
 * internal structure.
 */

// Re-export main functions
export { getDatabase, closeDatabase, dbLogger } from './connection.js';
export { initDatabase } from './init.js';

// Re-export table creation functions for direct use if needed
export { createInventoryTable } from './inventory.js';
export { createSettingsTable } from './settings.js';
export { createSchematicsTable, createFavoritesTable } from './schematics.js';
export { createResourcesTable, createResourceClassesTable } from './resources.js';
export { createMailsTables } from './mails.js';
export { createSalesTable } from './sales.js';
export { createLoadoutsTable } from './loadouts.js';
