import { json } from '@sveltejs/kit';
import { updateInventoryItem, getInventoryItem } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { category, markLevel, action, quantity } = await request.json();
    
    if (!category || !markLevel || !action) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let newQuantity: number;
    const currentQuantity = getInventoryItem(category, markLevel);
    
    switch (action) {
      case 'increment':
        newQuantity = currentQuantity + 1;
        break;
      case 'decrement':
        newQuantity = Math.max(0, currentQuantity - 1);
        break;
      case 'set':
        if (typeof quantity !== 'number' || quantity < 0) {
          return json({ error: 'Invalid quantity' }, { status: 400 });
        }
        newQuantity = quantity;
        break;
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
    
    updateInventoryItem(category, markLevel, newQuantity);
    
    return json({ 
      success: true, 
      category, 
      markLevel, 
      quantity: newQuantity 
    });
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
