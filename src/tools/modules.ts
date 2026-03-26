import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerModuleTools(server: McpServer): void {

  server.tool(
    'plane-module-list',
    'List all modules in a project. Modules group related issues together.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/modules/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-module-detail',
    'Get details of a specific module.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      module_id: z.string().uuid().describe('Module UUID'),
    },
    async ({ project_id, module_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/modules/${module_id}/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-module-create',
    'Create a new module in a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('Module name'),
      description: z.string().optional().describe('Module description'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      target_date: z.string().optional().describe('Target date (YYYY-MM-DD)'),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await planeClient.v1Post(`/projects/${project_id}/modules/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-module-add-issues',
    'Add issues to a module.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      module_id: z.string().uuid().describe('Module UUID'),
      issue_ids: z.array(z.string().uuid()).describe('Issue UUIDs to add'),
    },
    async ({ project_id, module_id, issue_ids }) => {
      try {
        const data = await planeClient.v1Post(
          `/projects/${project_id}/modules/${module_id}/issues/`,
          { issues: issue_ids }
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-module-remove-issue',
    'Remove an issue from a module.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      module_id: z.string().uuid().describe('Module UUID'),
      issue_id: z.string().uuid().describe('Issue UUID to remove'),
    },
    async ({ project_id, module_id, issue_id }) => {
      try {
        await planeClient.v1Delete(`/projects/${project_id}/modules/${module_id}/issues/${issue_id}/`);
        return { content: [{ type: 'text', text: `Issue ${issue_id} removed from module` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
