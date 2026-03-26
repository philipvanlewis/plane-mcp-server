import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerMemberTools(server: McpServer): void {

  server.tool(
    'plane-member-list',
    'List all members of a project.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/members/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-workspace-member-list',
    'List all members of the workspace.',
    {},
    async () => {
      try {
        const data = await planeClient.v1Get('/members/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
