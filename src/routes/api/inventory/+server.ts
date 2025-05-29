import { json } from '@sveltejs/kit';
import { updateInventoryItem, getInventoryItem, getAllInventory, getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, type MarkLevel, type PartCategory, PART_CATEGORIES, MARK_LEVELS } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get('category') as PartCategory;
  const markLevel = url.searchParams.get('markLevel') as MarkLevel;
  const includeSchematic = url.searchParams.get('includeSchematic') === 'true';
  const includeAll = url.searchParams.get('all') === 'true';

  try {
    // If requesting all inventory data
    if (includeAll) {
      const inventory = getAllInventory();
      
      if (includeSchematic) {
        // Add schematic data for each inventory item
        const inventoryWithSchematics = Object.entries(inventory).map(([key, quantity]) => {
          const [cat, mark] = key.split('-');
          const schematicId = SCHEMATIC_ID_MAP[key];
          
          let schematic = null;
          let displayName = `Mark ${mark} ${cat}`;
          
          if (schematicId) {
            schematic = getSchematicById(schematicId);
            if (schematic) {
              displayName = schematic.name;
              // For blasters, use custom naming
              if (cat.startsWith('Blaster')) {
                const color = cat.includes('Green') ? 'Green' : 'Red';
                displayName = getBlasterName(mark as MarkLevel, color as 'Green' | 'Red');
              }
            }
          }
          
          return {
            category: cat,
            markLevel: mark,
            quantity,
            displayName,
            schematic,
            schematicId
          };
        });
        
        return json({ inventory: inventoryWithSchematics });
      }
      
      // Return just inventory quantities
      return json({ inventory });
    }

    // If requesting specific item
    if (!category || !markLevel) {
      return json({ error: 'Missing category or markLevel parameters. Use ?all=true for full inventory.' }, { status: 400 });
    }

    const quantity = getInventoryItem(category, markLevel);
    const inventoryKey = `${category}-${markLevel}`;
    
    let response: any = {
      category,
      markLevel,
      quantity
    };

    // Add schematic data if requested
    if (includeSchematic) {
      const schematicId = SCHEMATIC_ID_MAP[inventoryKey];
      
      if (schematicId) {
        const schematic = getSchematicById(schematicId);
        
        if (schematic) {
          let displayName = schematic.name;
          
          // For blasters, use custom naming
          if (category.startsWith('Blaster')) {
            const color = category.includes('Green') ? 'Green' : 'Red';
            displayName = getBlasterName(markLevel, color as 'Green' | 'Red');
          }
          
          response.displayName = displayName;
          response.schematic = {
            id: schematic.id,
            name: schematic.name,
            category: schematic.category,
            profession: schematic.profession,
            complexity: schematic.complexity,
            datapad: schematic.datapad
          };
          response.schematicId = schematicId;
        }
      }
    }

    return json(response);

  } catch (error) {
    console.error('Error fetching inventory:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

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
