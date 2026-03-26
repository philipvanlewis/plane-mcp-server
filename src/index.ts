#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { planeClient } from './client.js';
import { registerTools } from './tools/index.js';
import { logger } from './utils/logger.js';

const server = new McpServer({
  name: 'plane-mcp-server',
  version: '0.1.0',
});

registerTools(server);

async function main() {
  // Pre-authenticate session for page/asset tools
  try {
    await planeClient.authenticate();
    logger.info('Plane session ready');
  } catch (error) {
    logger.warn('Session auth failed on startup — will retry on first use', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Plane MCP server running on stdio (51 tools)');
}

main().catch((error) => {
  logger.error('Fatal startup error', { error: String(error) });
  process.exit(1);
});
