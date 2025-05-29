import { json } from '@sveltejs/kit';
import { getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, type MarkLevel } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get('category');
  const markLevel = url.searchParams.get('markLevel');

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

    // Get the full schematic data
    const schematic = getSchematicById(schematicId);
    
    if (!schematic) {
      return json({ error: 'Schematic data not found' }, { status: 404 });
    }

    // Add some enhanced information
    let displayName = schematic._name;
    
    // For blasters, use our custom naming function
    if (category.startsWith('Blaster')) {
      const color = category.includes('Green') ? 'Green' : 'Red';
      displayName = getBlasterName(markLevel, color);
    }

    return json({
      inventoryKey,
      schematicId,
      schematic: {
        id: schematic._id,
        name: schematic._name,
        displayName,
        category: schematic._category,
        description: schematic.misc?._desc || '',
        complexity: schematic.statistics?._complexity || 0,
        resources: schematic.resource || []
      }
    });

  } catch (error) {
    console.error('Error fetching inventory schematic:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
