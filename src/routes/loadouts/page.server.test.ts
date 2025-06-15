import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.js';

describe('Loadouts Page Server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should load loadouts and chassis data successfully', async () => {
		const mockFetch = vi.fn();

		// Mock successful loadouts API response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				loadouts: [
					{
						id: 'test-loadout',
						name: 'Test Loadout',
						shipType: 'Scyk',
						variant: 'High Mass Variant',
						markLevel: 'I',
						price: 75000,
						quantity: 1
					}
				]
			})
		});

		// Mock successful chassis API response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => [
				{
					id: 'test-chassis',
					name: 'Test Chassis',
					shipType: 'Scyk',
					variant: 'High Mass Variant',
					price: 195000,
					quantity: 1
				}
			]
		});

		const result = await load({ fetch: mockFetch });

		expect(result).toEqual({
			loadouts: expect.arrayContaining([
				expect.objectContaining({
					id: 'test-loadout',
					name: 'Test Loadout'
				})
			]),
			chassis: expect.arrayContaining([
				expect.objectContaining({
					id: 'test-chassis',
					name: 'Test Chassis'
				})
			])
		});
	});

	it('should handle loadouts API failure gracefully', async () => {
		const mockFetch = vi.fn();

		// Mock failed loadouts API response
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'Failed to fetch loadouts' })
		});

		const result = await load({ fetch: mockFetch });

		expect(result).toEqual({
			loadouts: [],
			chassis: []
		});
	});

	it('should handle chassis API failure gracefully', async () => {
		const mockFetch = vi.fn();

		// Mock successful loadouts API response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ loadouts: [] })
		});

		// Mock failed chassis API response
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'Failed to fetch chassis' })
		});

		const result = await load({ fetch: mockFetch });

		expect(result).toEqual({
			loadouts: [],
			chassis: []
		});
	});
});
