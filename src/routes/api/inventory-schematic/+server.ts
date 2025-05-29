import { json } from '@sveltejs/kit';
import { getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, type MarkLevel, type PartCategory } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

// Raw schematic data from XML has underscore-prefixed properties
interface RawSchematic {
  _id: string;
  _name: string;
  _category?: string;
  _profession?: string;
  _complexity?: string;
  _datapad?: string;
  [key: string]: any;
}

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

    // Get the full schematic data (this returns the parsed JSON with underscore properties)
    const schematicData = getSchematicById(schematicId);
    
    if (!schematicData) {
      return json({ error: 'Schematic data not found' }, { status: 404 });
    }

    // Cast to access underscore properties from the raw XML data
    const rawSchematic = schematicData as unknown as RawSchematic;

    // Add some enhanced information
    let displayName = rawSchematic._name;
    
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
        id: rawSchematic._id,
        name: rawSchematic._name,
        category: rawSchematic._category || '',
        profession: rawSchematic._profession || '',
        complexity: parseInt(rawSchematic._complexity || '0'),
        datapad: parseInt(rawSchematic._datapad || '0')
      },
      schematicId
    });

  } catch (error) {
    console.error('Error fetching inventory schematic:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
