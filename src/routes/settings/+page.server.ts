import { getRecommendedStockLevel } from '$lib/database.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  const recommendedStockLevel = getRecommendedStockLevel();
  
  return {
    settings: {
      recommendedStockLevel
    }
  };
};
