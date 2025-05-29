import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    // Fetch inventory data from our API
    const inventoryResponse = await fetch('/api/inventory?all=true');
    const inventoryData = await inventoryResponse.json();
    
    // Fetch settings from the settings API
    const settingsResponse = await fetch('/api/settings');
    const settingsData = await settingsResponse.json();
    
    if (!inventoryResponse.ok) {
      throw new Error('Failed to fetch inventory data');
    }
    
    if (!settingsResponse.ok) {
      throw new Error('Failed to fetch settings data');
    }
    
    // Convert inventory array back to the object format expected by the UI
    const inventory: Record<string, number> = {};
    if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
      inventoryData.inventory.forEach((item: any) => {
        const key = `${item.category}-${item.markLevel}`;
        inventory[key] = item.quantity;
      });
    } else if (inventoryData.inventory && typeof inventoryData.inventory === 'object') {
      // If it's already in object format
      Object.assign(inventory, inventoryData.inventory);
    }
    
    return {
      inventory,
      settings: settingsData
    };
  } catch (error) {
    console.error('Error loading inventory data:', error);
    return {
      inventory: {},
      settings: { recommendedStockLevel: 10 }
    };
  }
};
