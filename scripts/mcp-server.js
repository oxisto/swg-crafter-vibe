#!/usr/bin/env node

// MCP Server for SWG Shipwright Assistant
// This script provides Model Context Protocol tools for external MCP clients

import { runMCPServer } from '../src/lib/mcp-server.js';

console.log('Starting SWG Shipwright MCP Server...');
console.log('This server provides tools for inventory and schematics data access.');
console.log('Connect your MCP client to this server for advanced AI integration.');
console.log('');

// Start the MCP server
runMCPServer().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
