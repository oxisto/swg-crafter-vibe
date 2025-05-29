# AI Assistant Features

This document describes the AI-powered features in the SWG Shipwright Manager.

## Overview

The AI Assistant provides intelligent insights and recommendations for your shipwright inventory management using OpenAI's GPT models with advanced function calling capabilities for real-time data access.

## Features

### 🤖 Chat Interface

- Natural language interaction with your inventory data
- Context-aware responses based on current stock levels
- Conversation memory for follow-up questions
- Pre-built conversation starters
- **NEW**: Beautiful markdown rendering for formatted responses

### 📊 Inventory Analysis

- Real-time stock level analysis via dynamic function calls
- Low stock alerts and recommendations
- Optimal inventory suggestions
- Profit optimization advice

### 🔧 Schematic Intelligence

- Access to complete SWGAide schematics database
- Schematic search and filtering
- Production requirement analysis
- Crafting recommendations

### ✨ Function Calling Architecture

- **Dynamic Data Access**: AI fetches only the data it needs, when it needs it
- **Token Efficient**: No large context dumps, reducing API costs
- **Real-time**: Always gets the latest inventory and schematic data
- **Intelligent**: AI chooses the right function for each query

## Setup

### 1. OpenAI API Key

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_api_key_here
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key.

## Function Calling Capabilities

The AI assistant uses OpenAI function calling to dynamically access:

## Function Calling Capabilities

The AI assistant uses OpenAI function calling to dynamically access:

### 1. `get_inventory` Function

- **Purpose**: Retrieve current inventory data
- **Parameters**: Optional category and mark level filtering
- **Returns**: Real-time stock quantities for all or specific parts
- **Usage**: "How many engines do I have?" or "Show all my inventory"

### 2. `get_schematics` Function

- **Purpose**: Search and filter schematics database
- **Parameters**: Optional search query, category filter, mark level filter
- **Returns**: Matching schematics with details
- **Usage**: "Find schematics with 'Advanced' in the name" or "Show all engine schematics"

### 3. `analyze_stock_levels` Function

- **Purpose**: Analyze inventory against recommended levels
- **Parameters**: None (analyzes full inventory)
- **Returns**: Detailed stock analysis with recommendations
- **Usage**: "Analyze my stock levels" or "What should I restock?"

### Benefits of Function Calling

- **⚡ Real-time Data**: Always gets the latest information
- **💰 Cost Efficient**: Only fetches needed data, reducing token usage
- **🎯 Precise**: AI chooses the right function for each query
- **🔄 Dynamic**: Adapts to your specific questions automatically

## Data Access

### Inventory Data

- Current stock levels for all part categories
- Mark levels (I-V) for each part type
- Stock history and trends
- Recommended stock level comparisons

### Schematics Database

- 3,673+ ship component schematics
- Schematic categories and requirements
- Production complexity information
- Component relationships

### Analysis Functions

- Stock level analysis with recommendations
- Production requirement calculations
- Profit optimization suggestions
- Market trend insights

## Chat Interface

### Features

- **Real-time Chat**: Interactive conversation with AI
- **Function Calling**: AI dynamically calls functions to get fresh data
- **Conversation Starters**: Pre-built prompts for common tasks
- **Message History**: Maintains conversation context
- **Markdown Rendering**: Beautiful formatting for AI responses
- **Error Handling**: Graceful error messages and recovery

### Markdown Support

AI responses are rendered with full markdown support including:

- **Headers and Subheaders**: Properly styled hierarchy
- **Tables**: Formatted inventory and analysis tables
- **Lists**: Organized bullet points and numbered lists
- **Code Blocks**: Syntax highlighting for technical content
- **Emphasis**: Bold and italic text formatting
- **Blockquotes**: Highlighted important information

### Sample Interactions

- "Show me my armor parts inventory in a table format"
- "Give me a detailed analysis with headers and bullet points"
- "Which parts am I running low on?"
- "Analyze my stock levels and give recommendations"
- "What's the most valuable thing I can build right now?"
- "Find all schematics with 'Advanced' in the name"

## Technical Architecture

### API Endpoints

#### `/api/chat`

**POST** - Chat with AI assistant using OpenAI function calling

```typescript
{
  message: string;
  conversation?: Array<{role: 'user' | 'assistant', content: string}>;
}
```

Response:

```typescript
{
  message: string;
  usage?: OpenAI.Usage;
}
```

### OpenAI Function Calling Integration

The AI assistant uses OpenAI's function calling feature to dynamically access data:

#### Function Calling Flow

1. **User Query**: User asks a question in natural language
2. **Function Selection**: OpenAI determines which function(s) to call
3. **Data Retrieval**: Functions fetch real-time data from SQLite database
4. **Response Generation**: AI formulates response with fresh data
5. **Markdown Rendering**: Response is displayed with proper formatting

#### Available Functions

1. **`get_inventory`** - Retrieve current inventory data

   - Parameters: `category` (optional), `markLevel` (optional)
   - Returns: Current stock quantities for specified or all parts

2. **`get_schematics`** - Search and filter schematics database

   - Parameters: `query` (optional), `category` (optional), `markLevel` (optional)
   - Returns: Matching schematics with detailed information

3. **`analyze_stock_levels`** - Comprehensive stock analysis
   - Parameters: None
   - Returns: Stock level analysis with recommendations

#### Benefits

- **🔄 Always Fresh**: Data fetched in real-time, never stale
- **💡 Smart**: AI chooses appropriate functions automatically
- **💰 Efficient**: Only fetches needed data, reducing API costs
- **🎯 Precise**: Targeted queries for specific information

## Usage Examples

### Inventory Analysis

```
User: "What parts am I critically low on?"
AI: "Based on your current inventory analysis, you have zero stock of:
- Booster components (all mark levels)
- Most Reactor parts
- Several Shield components

I recommend prioritizing Booster Mark I and II parts as they're commonly used in many ship builds."
```

### Production Planning

```
User: "What's the most profitable thing I can build right now?"
AI: "Looking at your current stock levels, you have good supplies of:
- Armor Mark II (9 units)
- Engine Mark III (7 units)
- Capacitor Mark IV (4 units)

These are commonly used in mid-tier ship builds. I'd recommend focusing on Mark III Heavy Engine builds as they have good profit margins and you have sufficient stock."
```

### Stock Management

```
User: "Set recommended stock levels for all parts"
AI: "I can help you optimize stock levels! Based on typical usage patterns:
- Keep 10-15 units of Mark I and II parts (high turnover)
- Maintain 5-8 units of Mark III and IV parts (moderate usage)
- Stock 2-5 units of Mark V parts (specialty builds)

Would you like me to analyze specific categories for more detailed recommendations?"
```

## Error Handling

The system includes robust error handling for:

- Missing or invalid API keys
- Network connectivity issues
- OpenAI API rate limits
- Malformed requests
- Database connection errors

## Performance Considerations

- **Function Calling Efficiency**: Only fetches needed data, reducing token usage
- **Rate Limiting**: Respects OpenAI API rate limits
- **Database Optimization**: Fast SQLite queries for real-time responses
- **Markdown Rendering**: Client-side rendering using marked.js library
- **Token Management**: Optimized prompts and dynamic data loading

## Future Enhancements

### Planned Features

- **Voice Interface**: Speech-to-text and text-to-speech
- **Advanced Analytics**: Trend analysis and predictions
- **Market Integration**: Real-time market price data
- **Multi-language Support**: Support for multiple languages
- **Custom Models**: Fine-tuned models for SWG-specific knowledge
- **Streaming Responses**: Real-time response streaming
- **Export Functions**: Export conversations and analysis reports

### Function Calling Extensions

- **Additional Functions**: More specialized inventory and production tools
- **Batch Operations**: Multi-item inventory updates via AI commands
- **Market Analysis**: Price tracking and profit optimization functions
- **Production Planning**: Advanced crafting queue management
- **Collaborative Features**: Multi-user inventory management

## Security

### Best Practices

- Store API keys securely in environment variables
- Never commit API keys to version control
- Use environment-specific configurations
- Implement proper error handling to avoid key exposure

### Data Privacy

- Inventory data stays within your local system
- Only necessary context is sent to OpenAI
- No personal or sensitive information is transmitted
- Conversation history is stored locally only

## Troubleshooting

### Common Issues

1. **"API Key Required" Error**

   - Ensure `OPENAI_API_KEY` is set in `.env`
   - Verify the API key is valid and active
   - Check for typos in the environment variable name

2. **"Failed to send message" Error**

   - Check internet connectivity
   - Verify OpenAI API service status
   - Ensure you have sufficient API credits

3. **Slow Response Times**

   - Large inventory databases may increase response time
   - Consider using a more powerful OpenAI model
   - Check your internet connection speed

4. **Context Errors**
   - Restart the application to refresh data context
   - Check database connectivity
   - Verify schematics data is properly loaded

### Support

For technical issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed (`pnpm install`)
4. Check the application logs for detailed error information
