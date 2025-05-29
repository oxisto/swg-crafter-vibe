import { getAllInventory, getRecommendedStockLevel } from '$lib/database.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  const inventory = getAllInventory();
  const recommendedStockLevel = getRecommendedStockLevel();
  
  return {
    inventory,
    settings: {
      recommendedStockLevel
    }
  };
};
