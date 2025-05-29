import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    // Fetch settings from our API
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    return {
      settings: data
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      settings: {
        recommendedStockLevel: 10
      }
    };
  }
};
