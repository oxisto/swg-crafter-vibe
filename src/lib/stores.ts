import { writable } from 'svelte/store';
import type { Inventory, Settings } from './types.js';

// Create the inventory store
export const inventory = writable<Inventory>({});

// Create the settings store
export const settings = writable<Settings>({ recommendedStockLevel: 10 });

// Helper functions for inventory management with server persistence
export async function incrementStock(category: string, markLevel: string) {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        markLevel,
        action: 'increment'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      inventory.update(inv => {
        const key = `${category}-${markLevel}`;
        inv[key] = result.quantity;
        return inv;
      });
    }
  } catch (error) {
    console.error('Error incrementing stock:', error);
  }
}

export async function decrementStock(category: string, markLevel: string) {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        markLevel,
        action: 'decrement'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      inventory.update(inv => {
        const key = `${category}-${markLevel}`;
        inv[key] = result.quantity;
        return inv;
      });
    }
  } catch (error) {
    console.error('Error decrementing stock:', error);
  }
}

export async function setStock(category: string, markLevel: string, quantity: number) {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        markLevel,
        action: 'set',
        quantity
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      inventory.update(inv => {
        const key = `${category}-${markLevel}`;
        inv[key] = result.quantity;
        return inv;
      });
    }
  } catch (error) {
    console.error('Error setting stock:', error);
  }
}

// Settings management functions
export async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const result = await response.json();
      settings.set(result.settings);
      return result.settings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { recommendedStockLevel: 10 };
}

export async function updateRecommendedStockLevel(level: number) {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'recommendedStockLevel',
        value: level
      })
    });
    
    if (response.ok) {
      settings.update(s => {
        s.recommendedStockLevel = level;
        return s;
      });
    }
  } catch (error) {
    console.error('Error updating recommended stock level:', error);
  }
}
