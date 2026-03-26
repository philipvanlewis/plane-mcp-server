import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerCycleTools(server: McpServer): void {

  server.tool(
    'plane-cycle-list',
    'List all cycles (sprints) in a project.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/cycles/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-cycle-detail',
    'Get details of a specific cycle.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      cycle_id: z.string().uuid().describe('Cycle UUID'),
    },
    async ({ project_id, cycle_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/cycles/${cycle_id}/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-cycle-create',
    'Create a new cycle (sprint) in a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('Cycle name'),
      description: z.string().optional().describe('Cycle description'),
      start_date: z.string().describe('Start date (YYYY-MM-DD)'),
      end_date: z.string().describe('End date (YYYY-MM-DD)'),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await planeClient.v1Post(`/projects/${project_id}/cycles/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-cycle-add-issues',
    'Add issues to a cycle.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      cycle_id: z.string().uuid().describe('Cycle UUID'),
      issue_ids: z.array(z.string().uuid()).describe('Issue UUIDs to add'),
    },
    async ({ project_id, cycle_id, issue_ids }) => {
      try {
        const data = await planeClient.v1Post(
          `/projects/${project_id}/cycles/${cycle_id}/issues/`,
          { issues: issue_ids }
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-cycle-remove-issue',
    'Remove an issue from a cycle.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      cycle_id: z.string().uuid().describe('Cycle UUID'),
      issue_id: z.string().uuid().describe('Issue UUID to remove'),
    },
    async ({ project_id, cycle_id, issue_id }) => {
      try {
        await planeClient.v1Delete(`/projects/${project_id}/cycles/${cycle_id}/issues/${issue_id}/`);
        return { content: [{ type: 'text', text: `Issue ${issue_id} removed from cycle` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
