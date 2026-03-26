import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerStateTools(server: McpServer): void {

  server.tool(
    'plane-state-list',
    'List all workflow states in a project (Backlog, Todo, In Progress, Done, Cancelled).',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/states/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-state-create',
    'Create a new workflow state in a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('State name'),
      group: z.enum(['backlog', 'unstarted', 'started', 'completed', 'cancelled']).describe('State group'),
      color: z.string().default('#999999').describe('Hex color (e.g., "#ff0000")'),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await planeClient.v1Post(`/projects/${project_id}/states/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
