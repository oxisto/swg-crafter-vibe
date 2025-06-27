import { expect, vi } from 'vitest';

// Make sure globals are available
(global as any).expect = expect;
(global as any).vi = vi;

// Mock SvelteKit environment
global.fetch = vi.fn();

// Mock the data layer
vi.mock('$lib/data', () => ({
	db: {
		prepare: vi.fn(),
		exec: vi.fn()
	},
	getDatabase: vi.fn(() => ({
		prepare: vi.fn(),
		exec: vi.fn()
	}))
}));
