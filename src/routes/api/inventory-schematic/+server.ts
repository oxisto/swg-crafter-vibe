import { json } from '@sveltejs/kit';
import { getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, type MarkLevel, type PartCategory } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get('category') as PartCategory;
  const markLevel = url.searchParams.get('markLevel') as MarkLevel;

  if (!category || !markLevel) {
    return json({ error: 'Missing category or markLevel parameters' }, { status: 400 });
  }

  try {
    // Create inventory key
    const inventoryKey = `${category}-${markLevel}`;
    
    // Get schematic ID from our mapping
    const schematicId = SCHEMATIC_ID_MAP[inventoryKey];
    
    if (!schematicId) {
      return json({ error: 'No schematic found for this inventory item' }, { status: 404 });
    }

    // Get the clean schematic data (now stored with normalized property names)
    const schematic = getSchematicById(schematicId);
    
    if (!schematic) {
      return json({ error: 'Schematic data not found' }, { status: 404 });
    }

    // Add some enhanced information
    let displayName = schematic.name;
    
    // For blasters, use our custom naming function
    if (category.startsWith('Blaster')) {
      const color = category.includes('Green') ? 'Green' : 'Red';
      displayName = getBlasterName(markLevel, color as 'Green' | 'Red');
    }

    // Return clean schematic data
    return json({
      inventoryItem: {
        category,
        markLevel,
        displayName
      },
      schematic: {
        id: schematic.id,
        name: schematic.name,
        category: schematic.category,
        profession: schematic.profession,
        complexity: schematic.complexity,
        datapad: schematic.datapad
      },
      schematicId
    });

  } catch (error) {
    console.error('Error fetching inventory schematic:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
