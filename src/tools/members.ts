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

  server.tool(
    'plane-workspace-invite',
    'Invite a user to the workspace by email. They must accept the invite before they can be added to projects. Role: 5=Guest, 10=Viewer, 15=Member, 20=Admin.',
    {
      email: z.string().email().describe('Email address to invite'),
      role: z.number().describe('Role: 5=Guest, 10=Viewer, 15=Member, 20=Admin').default(5),
    },
    async ({ email, role }) => {
      try {
        const data = await planeClient.v1Post('/invitations/', { email, role });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-workspace-invitation-list',
    'List pending workspace invitations.',
    {},
    async () => {
      try {
        const data = await planeClient.v1Get('/invitations/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-workspace-invitation-delete',
    'Delete/revoke a pending workspace invitation.',
    {
      invitation_id: z.string().uuid().describe('Invitation UUID'),
    },
    async ({ invitation_id }) => {
      try {
        await planeClient.v1Delete(`/invitations/${invitation_id}/`);
        return { content: [{ type: 'text', text: 'Invitation deleted.' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-project-member-add',
    'Add an existing workspace member to a project. The user must already be a workspace member (accepted invite). Role: 5=Guest, 10=Viewer, 15=Member, 20=Admin.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      member_id: z.string().uuid().describe('User UUID (from workspace-member-list)'),
      role: z.number().describe('Role: 5=Guest, 10=Viewer, 15=Member, 20=Admin').default(5),
    },
    async ({ project_id, member_id, role }) => {
      try {
        const data = await planeClient.v1Post(`/projects/${project_id}/members/`, { member: member_id, role });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-project-member-remove',
    'Remove a member from a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      membership_id: z.string().uuid().describe('Membership record UUID (from member-list response id field)'),
    },
    async ({ project_id, membership_id }) => {
      try {
        await planeClient.v1Delete(`/projects/${project_id}/members/${membership_id}/`);
        return { content: [{ type: 'text', text: 'Member removed from project.' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
