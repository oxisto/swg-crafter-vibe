import { json } from '@sveltejs/kit';
import { getSetting, setSetting, getRecommendedStockLevel, setRecommendedStockLevel } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
  try {
    const recommendedStockLevel = getRecommendedStockLevel();
    
    return json({
      recommendedStockLevel
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return json({ error: 'Failed to get settings' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { key, value } = await request.json();
    
    if (key === 'recommendedStockLevel') {
      const level = parseInt(value.toString(), 10);
      if (isNaN(level) || level < 0) {
        return json({ error: 'Invalid recommended stock level' }, { status: 400 });
      }
      
      setRecommendedStockLevel(level);
      
      return json({
        success: true,
        recommendedStockLevel: level
      });
    } else {
      // Generic setting update
      setSetting(key, value.toString());
      
      return json({
        success: true,
        key,
        value: value.toString()
      });
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    return json({ error: 'Failed to update setting' }, { status: 500 });
  }
};
