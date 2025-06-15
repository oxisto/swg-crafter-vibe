import { expect, vi } from 'vitest';

// Make sure globals are available
global.expect = expect;
global.vi = vi;

// Mock SvelteKit environment
global.fetch = vi.fn();

// Mock the database
vi.mock('$lib/database', () => ({
	db: {
		prepare: vi.fn(),
		exec: vi.fn()
	},
	getDatabase: vi.fn(() => ({
		prepare: vi.fn(),
		exec: vi.fn()
	}))
}));
