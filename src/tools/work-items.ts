import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';
import { markdownToPlaneHtml, addPlaneEditorClasses } from '../utils/html.js';

export function registerWorkItemTools(server: McpServer): void {

  // ── List ──────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-list',
    'List work items (issues) in a project with optional filters.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      state: z.string().optional().describe('Filter by state UUID'),
      priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional().describe('Filter by priority'),
      assignee: z.string().uuid().optional().describe('Filter by assignee UUID'),
      label: z.string().uuid().optional().describe('Filter by label UUID'),
    },
    async ({ project_id, state, priority, assignee, label }) => {
      try {
        const params = new URLSearchParams();
        if (state) params.set('state', state);
        if (priority) params.set('priority', priority);
        if (assignee) params.set('assignees__in', assignee);
        if (label) params.set('labels__in', label);
        const qs = params.toString();
        const path = `/projects/${project_id}/issues/${qs ? '?' + qs : ''}`;
        const data = await planeClient.v1Get(path);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Detail ────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-detail',
    'Get full details of a work item including description, comments count, and relationships.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
    },
    async ({ project_id, issue_id }) => {
      try {
        const data = await planeClient.v1Get(`/projects/${project_id}/issues/${issue_id}/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Create ────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-create',
    'Create a new work item (issue). Description accepts markdown (default) or HTML.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('Issue title'),
      description: z.string().optional().describe('Issue body content'),
      description_format: z.enum(['markdown', 'html']).default('markdown').describe('Description format'),
      priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).default('medium').describe('Priority level'),
      state_id: z.string().uuid().optional().describe('State UUID'),
      label_ids: z.array(z.string().uuid()).optional().describe('Label UUIDs'),
      assignee_ids: z.array(z.string().uuid()).optional().describe('Assignee UUIDs'),
      parent_id: z.string().uuid().optional().describe('Parent issue UUID (creates sub-issue)'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      target_date: z.string().optional().describe('Due date (YYYY-MM-DD)'),
    },
    async ({ project_id, name, description, description_format, priority, state_id, label_ids, assignee_ids, parent_id, start_date, target_date }) => {
      try {
        const body: Record<string, unknown> = { name, priority };

        if (description) {
          body.description_html = description_format === 'markdown'
            ? markdownToPlaneHtml(description)
            : addPlaneEditorClasses(description);
        }
        if (state_id) body.state = state_id;
        if (label_ids?.length) body.labels = label_ids;
        if (assignee_ids?.length) body.assignees = assignee_ids;
        if (parent_id) body.parent = parent_id;
        if (start_date) body.start_date = start_date;
        if (target_date) body.target_date = target_date;

        const data = await planeClient.v1Post(`/projects/${project_id}/issues/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Update ────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-update',
    'Update a work item. Only include fields you want to change.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
      name: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description content'),
      description_format: z.enum(['markdown', 'html']).default('markdown').describe('Description format'),
      priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional(),
      state_id: z.string().uuid().optional().describe('New state UUID'),
      label_ids: z.array(z.string().uuid()).optional().describe('Replace all labels'),
      assignee_ids: z.array(z.string().uuid()).optional().describe('Replace all assignees'),
      parent_id: z.string().uuid().optional().describe('Set parent issue'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      target_date: z.string().optional().describe('Due date (YYYY-MM-DD)'),
    },
    async ({ project_id, issue_id, name, description, description_format, priority, state_id, label_ids, assignee_ids, parent_id, start_date, target_date }) => {
      try {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (description !== undefined) {
          body.description_html = description_format === 'markdown'
            ? markdownToPlaneHtml(description)
            : addPlaneEditorClasses(description);
        }
        if (priority !== undefined) body.priority = priority;
        if (state_id !== undefined) body.state = state_id;
        if (label_ids !== undefined) body.labels = label_ids;
        if (assignee_ids !== undefined) body.assignees = assignee_ids;
        if (parent_id !== undefined) body.parent = parent_id;
        if (start_date !== undefined) body.start_date = start_date;
        if (target_date !== undefined) body.target_date = target_date;

        const data = await planeClient.v1Patch(`/projects/${project_id}/issues/${issue_id}/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Delete ────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-delete',
    'Delete a work item.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
    },
    async ({ project_id, issue_id }) => {
      try {
        await planeClient.v1Delete(`/projects/${project_id}/issues/${issue_id}/`);
        return { content: [{ type: 'text', text: `Issue ${issue_id} deleted` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Comments ──────────────────────────────────────────────────

  server.tool(
    'plane-work-item-comment-list',
    'List all comments on a work item.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
    },
    async ({ project_id, issue_id }) => {
      try {
        const data = await planeClient.get(`/projects/${project_id}/issues/${issue_id}/comments/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-work-item-comment-add',
    'Add a comment to a work item. Accepts markdown (default) or HTML.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
      comment: z.string().describe('Comment content'),
      format: z.enum(['markdown', 'html']).default('markdown').describe('Comment format'),
    },
    async ({ project_id, issue_id, comment, format }) => {
      try {
        const html = format === 'markdown' ? markdownToPlaneHtml(comment) : addPlaneEditorClasses(comment);
        const data = await planeClient.post(`/projects/${project_id}/issues/${issue_id}/comments/`, {
          comment_html: html,
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Links ─────────────────────────────────────────────────────

  server.tool(
    'plane-work-item-link-add',
    'Add a URL link to a work item.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
      url: z.string().url().describe('Link URL'),
      title: z.string().optional().describe('Link title/label'),
    },
    async ({ project_id, issue_id, url, title }) => {
      try {
        const data = await planeClient.post(`/projects/${project_id}/issues/${issue_id}/links/`, {
          url,
          title: title || url,
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Activity ──────────────────────────────────────────────────

  server.tool(
    'plane-work-item-activity',
    'Get the activity history of a work item (state changes, assignments, comments, etc.).',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      issue_id: z.string().uuid().describe('Issue UUID'),
    },
    async ({ project_id, issue_id }) => {
      try {
        const data = await planeClient.get(`/projects/${project_id}/issues/${issue_id}/activities/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
