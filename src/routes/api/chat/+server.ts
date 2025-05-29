import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { getAllInventory, getAllSchematics, getSchematicById } from '$lib/database.js';
import { SCHEMATIC_ID_MAP, getBlasterName, PART_CATEGORIES, MARK_LEVELS } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || '',
});

// Function calling implementations
function getInventoryTool(args: any) {
  const inventory = getAllInventory();
  const inventoryWithDetails = Object.entries(inventory).map(([key, quantity]) => {
    const [category, markLevel] = key.split('-');
    const schematicId = SCHEMATIC_ID_MAP[key];
    
    let displayName = `Mark ${markLevel} ${category}`;
    let schematic = null;
    
    if (schematicId) {
      schematic = getSchematicById(schematicId);
      if (schematic) {
        displayName = schematic.name;
        // For blasters, use custom naming
        if (category.startsWith('Blaster')) {
          const color = category.includes('Green') ? 'Green' : 'Red';
          displayName = getBlasterName(markLevel as any, color as any);
        }
      }
    }
    
    return {
      category,
      markLevel,
      quantity,
      displayName,
      schematicId,
      key,
    };
  });

  // Apply filters if provided
  let filtered = inventoryWithDetails;
  
  if (args.category) {
    filtered = filtered.filter(item => item.category === args.category);
  }
  
  if (args.markLevel) {
    filtered = filtered.filter(item => item.markLevel === args.markLevel);
  }

  const result = {
    inventory: filtered,
    summary: {
      totalItems: filtered.length,
      totalQuantity: filtered.reduce((sum, item) => sum + item.quantity, 0),
      zeroStock: filtered.filter(item => item.quantity === 0).length,
      lowStock: filtered.filter(item => item.quantity > 0 && item.quantity < 5).length,
    },
  };

  return args.includeDetails ? result : result.summary;
}

function getSchematicsTool(args: any) {
  const schematics = getAllSchematics();
  let filtered = schematics;

  // Note: Category filtering is disabled because categories are numeric IDs, not searchable text
  // if (args.category) {
  //   filtered = filtered.filter(s => 
  //     s.category?.toLowerCase().includes(args.category.toLowerCase())
  //   );
  // }

  if (args.search) {
    const search = args.search.toLowerCase();
    filtered = filtered.filter(s =>
      s.name?.toLowerCase().includes(search)
      // Removed category search since it's just a numeric ID
    );
  }

  // Limit results
  filtered = filtered.slice(0, args.limit || 50);

  return {
    schematics: filtered,
    summary: {
      totalFound: filtered.length,
      categories: [...new Set(filtered.map(s => s.category))].filter(Boolean),
    },
  };
}

function analyzeStockLevelsTool(args: any) {
  const inventory = getAllInventory();
  const recommendedLevel = args.recommendedLevel || 10;

  const analysis = {
    criticalStock: [] as any[],
    lowStock: [] as any[],
    adequateStock: [] as any[],
    overStock: [] as any[],
    summary: {
      totalItems: 0,
      zeroStock: 0,
      lowStock: 0,
      adequateStock: 0,
      overStock: 0,
    },
  };

  Object.entries(inventory).forEach(([key, quantity]) => {
    const [category, markLevel] = key.split('-');
    const item = {
      key,
      category,
      markLevel,
      quantity,
      recommendedLevel,
    };

    analysis.summary.totalItems++;

    if (quantity === 0) {
      analysis.criticalStock.push(item);
      analysis.summary.zeroStock++;
    } else if (quantity < recommendedLevel * 0.3) {
      analysis.lowStock.push(item);
      analysis.summary.lowStock++;
    } else if (quantity <= recommendedLevel) {
      analysis.adequateStock.push(item);
      analysis.summary.adequateStock++;
    } else {
      analysis.overStock.push(item);
      analysis.summary.overStock++;
    }
  });

  return analysis;
}

// Define tools for OpenAI function calling
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_inventory',
      description: 'Get current inventory levels for ship parts. Can filter by category and mark level.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by part category',
            enum: PART_CATEGORIES,
          },
          markLevel: {
            type: 'string',
            description: 'Filter by mark level',
            enum: MARK_LEVELS,
          },
          includeDetails: {
            type: 'boolean',
            description: 'Include detailed information about each part',
            default: false,
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_schematics',
      description: 'Get schematic data for ship components. Can search schematics by name.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter schematics by name (e.g., "Mark I", "Engine", "Starfighter")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 50,
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_stock_levels',
      description: 'Analyze current stock levels and provide recommendations.',
      parameters: {
        type: 'object',
        properties: {
          recommendedLevel: {
            type: 'number',
            description: 'The recommended stock level to compare against',
            default: 10,
          },
        },
      },
    },
  },
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, conversation = [] } = await request.json();
    
    if (!message) {
      return json({ error: 'Message is required' }, { status: 400 });
    }
    
    if (!OPENAI_API_KEY) {
      return json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Create system message without bulky data - AI will fetch what it needs
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for a Star Wars Galaxies shipwright inventory management system.

You have access to the following tools to get real-time data:
- get_inventory: Get current inventory levels (can filter by category/mark level)
- get_schematics: Search and filter schematic database  
- analyze_stock_levels: Get detailed stock analysis and recommendations

PART CATEGORIES: ${PART_CATEGORIES.join(', ')}
MARK LEVELS: ${MARK_LEVELS.join(', ')} (I=Light, II=Mid-Grade, III=Heavy, IV=Advanced, V=Experimental)

IMPORTANT TERMINOLOGY MAPPINGS:
When users ask about starship parts, be aware that the schematic database uses different names than the inventory categories:

STARSHIP ARMOR:
- Inventory category: "Armor" 
- Schematic names: "Mark I Durasteel Plating", "Mark II Durasteel Plating", etc.
- When searching for armor schematics, use terms like "durasteel plating" or "plating"

STARSHIP ENGINES:
- Inventory category: "Engine"
- Schematic names: "Mark I Starfighter Engine", "Mark II Starfighter Engine", etc.
- Search terms: "starfighter engine" or "engine"

STARSHIP WEAPONS:
- Inventory categories: "Blaster (Green)", "Blaster (Red)"
- Schematic names: 
  * Mark I = "Light Blaster (Green/Red)"
  * Mark II = "Mid-Grade Blaster (Green/Red)"  
  * Mark III = "Heavy Blaster (Green/Red)"
  * Mark IV = "Advanced Blaster (Green/Red)"
  * Mark V = "Experimental Blaster (Green/Red)"
- Search terms: "blaster", "light blaster", "heavy blaster", "advanced blaster", etc.

OTHER COMPONENTS:
- Most other categories (Booster, Capacitor, Droid Interface, Reactor, Shield) typically match their schematic names closely

You can help with:
- Analyzing current stock levels
- Recommending what to craft or acquire
- Explaining schematic requirements
- Suggesting optimal inventory management strategies
- Answering questions about Star Wars Galaxies shipwright mechanics

Always use the tools to get current data before providing advice. Be specific and actionable in your recommendations.`,
    };
    
    // Build conversation history
    const messages = [
      systemMessage,
      ...conversation,
      { role: 'user' as const, content: message },
    ];

    // First OpenAI call with function calling enabled
    let completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1500,
      temperature: 0.7,
    });

    let assistantMessage = completion.choices[0].message;

    // Handle function calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add the assistant's message with tool calls to the conversation
      messages.push(assistantMessage);

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        let result;
        
        try {
          switch (functionName) {
            case 'get_inventory':
              result = getInventoryTool(functionArgs);
              break;
            case 'get_schematics':
              result = getSchematicsTool(functionArgs);
              break;
            case 'analyze_stock_levels':
              result = analyzeStockLevelsTool(functionArgs);
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }
        } catch (error) {
          result = { error: `Error calling ${functionName}: ${error}` };
        }

        // Add tool result to conversation
        messages.push({
          role: 'tool' as const,
          content: JSON.stringify(result, null, 2),
          tool_call_id: toolCall.id,
        });
      }

      // Call OpenAI again with the tool results
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1500,
        temperature: 0.7,
      });

      assistantMessage = completion.choices[0].message;
    }

    const aiResponse = assistantMessage.content;
    
    if (!aiResponse) {
      return json({ error: 'No response from AI' }, { status: 500 });
    }

    return json({
      message: aiResponse,
      usage: completion.usage,
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return json({ error: 'Invalid OpenAI API key' }, { status: 401 });
    }
    
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
