import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerLabelTools(server: McpServer): void {

  server.tool(
    'plane-label-list',
    'List all labels in a project.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/labels/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-label-create',
    'Create a new label in a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('Label name'),
      color: z.string().default('#999999').describe('Hex color'),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await planeClient.v1Post(`/projects/${project_id}/labels/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-label-delete',
    'Delete a label from a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      label_id: z.string().uuid().describe('Label UUID'),
    },
    async ({ project_id, label_id }) => {
      try {
        await planeClient.v1Delete(`/projects/${project_id}/labels/${label_id}/`);
        return { content: [{ type: 'text', text: `Label ${label_id} deleted` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
