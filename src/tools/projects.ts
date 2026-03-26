import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerProjectTools(server: McpServer): void {

  server.tool(
    'plane-project-list',
    'List all projects in the workspace.',
    {},
    async () => {
      try {
        const data = await planeClient.v1Get('/projects/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-project-detail',
    'Get details of a specific project.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-project-create',
    'Create a new project in the workspace.',
    {
      name: z.string().describe('Project name'),
      identifier: z.string().min(1).max(12).describe('Short identifier (e.g., "MB", "EZ")'),
      description: z.string().optional().describe('Project description'),
      network: z.number().default(2).describe('0=secret, 2=public to workspace members'),
    },
    async (body) => {
      try {
        const data = await planeClient.v1Post('/projects/', body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-project-update',
    'Update project settings (name, description, network).',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      network: z.number().optional().describe('0=secret, 2=public'),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await planeClient.v1Patch(`/projects/${project_id}/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
