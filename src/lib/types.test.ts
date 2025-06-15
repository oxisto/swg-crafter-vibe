import { describe, it, expect } from 'vitest';
import { MARK_LEVELS, getInventoryKey, type MarkLevel } from './types.js';

describe('Types Module', () => {
	describe('MarkLevel', () => {
		it('should define all mark levels correctly', () => {
			expect(MARK_LEVELS).toEqual(['I', 'II', 'III', 'IV', 'V']);
		});

		it('should generate correct inventory keys', () => {
			expect(getInventoryKey('Armor', 'I')).toBe('Armor-I');
			expect(getInventoryKey('Engine', 'V')).toBe('Engine-V');
		});
	});

	describe('Mark Level Sorting', () => {
		it('should sort mark levels correctly', () => {
			const markOrder = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
			const markLevels: MarkLevel[] = ['V', 'I', 'III', 'II', 'IV'];

			const sorted = markLevels.sort((a, b) => markOrder[a] - markOrder[b]);

			expect(sorted).toEqual(['I', 'II', 'III', 'IV', 'V']);
		});
	});
});
