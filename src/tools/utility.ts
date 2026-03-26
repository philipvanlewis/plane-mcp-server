import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { planeClient } from '../client.js';
import { config } from '../config.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerUtilityTools(server: McpServer): void {

  server.tool(
    'plane-auth-status',
    'Check authentication status for both v1 API key and session-based auth. Useful for debugging connection issues.',
    {},
    async () => {
      const results: Record<string, unknown> = {
        baseUrl: config.baseUrl,
        workspace: config.workspaceSlug,
        sessionActive: planeClient.isSessionActive,
      };

      // Test v1 API key
      try {
        const projects = await planeClient.v1Get<unknown[]>('/projects/');
        results.v1ApiKey = { status: 'ok', projects: Array.isArray(projects) ? projects.length : 'unknown' };
      } catch (error) {
        results.v1ApiKey = { status: 'error', error: formatErrorForMcp(error) };
      }

      // Test session auth
      try {
        if (!planeClient.isSessionActive) {
          await planeClient.authenticate();
        }
        results.sessionAuth = { status: 'ok' };
      } catch (error) {
        results.sessionAuth = { status: 'error', error: formatErrorForMcp(error) };
      }

      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
  );
}
