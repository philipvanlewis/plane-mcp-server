import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';

export function registerCustomizationTools(server: McpServer): void {

  // ── Instance ──────────────────────────────────────────────────

  server.tool(
    'plane-instance-get',
    'Get instance settings (name, version, edition, domain, auth config). Requires admin access.',
    {},
    async () => {
      try {
        const data = await planeClient.get('/../../instances/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-instance-update',
    'Update instance settings (name, domain, telemetry). Requires admin access.',
    {
      instance_name: z.string().optional().describe('Instance display name'),
      domain: z.string().optional().describe('Instance domain URL'),
      is_telemetry_enabled: z.boolean().optional().describe('Enable/disable telemetry'),
    },
    async (body) => {
      try {
        const filtered = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
        const data = await planeClient.patch('/../../instances/', filtered);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Instance Configuration (32 keys) ──────────────────────────

  server.tool(
    'plane-instance-config-get',
    `Get all instance configuration keys (auth providers, SMTP, AI, etc). Requires admin access.
Categories: AUTHENTICATION, GOOGLE, GITHUB, GITLAB, GITEA, SMTP, AI, UNSPLASH, WORKSPACE_MANAGEMENT, INTERCOM`,
    {},
    async () => {
      try {
        const data = await planeClient.get('/../../instances/configurations/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-instance-config-update',
    `Update instance configuration keys. Pass key-value pairs.
Example keys: ENABLE_SIGNUP, ENABLE_MAGIC_LINK_LOGIN, ENABLE_EMAIL_PASSWORD, IS_GOOGLE_ENABLED, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_PORT, EMAIL_FROM, LLM_PROVIDER, LLM_MODEL, LLM_API_KEY, UNSPLASH_ACCESS_KEY, DISABLE_WORKSPACE_CREATION`,
    {
      config: z.record(z.string()).describe('Key-value pairs to update (e.g., {"ENABLE_SIGNUP": "1", "LLM_PROVIDER": "openai"})'),
    },
    async ({ config }) => {
      try {
        const data = await planeClient.patch('/../../instances/configurations/', config);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Workspace Settings ────────────────────────────────────────

  server.tool(
    'plane-workspace-get',
    'Get workspace settings (name, slug, logo, organization_size, timezone).',
    {},
    async () => {
      try {
        const data = await planeClient.get('/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-workspace-update',
    'Update workspace settings (name, organization_size, timezone).',
    {
      name: z.string().optional().describe('Workspace display name'),
      organization_size: z.string().optional().describe('Organization size (e.g., "2-10", "11-50", "51-200", "201-500")'),
      timezone: z.string().optional().describe('Timezone (e.g., "America/New_York")'),
    },
    async (body) => {
      try {
        const filtered = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
        const data = await planeClient.patch('/', filtered);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Workspace Logo ────────────────────────────────────────────

  server.tool(
    'plane-workspace-logo-upload',
    'Upload a new workspace logo. Accepts a local file path. Uses the presigned upload flow with entity_type WORKSPACE_LOGO.',
    {
      file_path: z.string().describe('Absolute path to logo image file'),
    },
    async ({ file_path: filePath }) => {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const mime = await import('mime-types');

        const fileBuffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);
        const mimeType = mime.default.lookup(fileName) || 'image/png';

        // Get workspace ID first
        const workspace = await planeClient.get<Record<string, unknown>>('/');
        const workspaceId = workspace.id as string;

        // Step 1: Create asset record
        const createResp = await planeClient.assetCreate<{
          asset_id: string;
          upload_data: { url: string; fields: Record<string, string> };
        }>('/', {
          name: fileName,
          type: mimeType,
          size: fileBuffer.length,
          entity_type: 'WORKSPACE_LOGO',
          entity_identifier: workspaceId,
        });

        // Step 2: Upload to presigned URL
        await planeClient.uploadToPresigned(
          createResp.upload_data.url,
          createResp.upload_data.fields,
          fileBuffer,
          fileName,
          mimeType,
        );

        // Step 3: Mark complete
        await planeClient.assetPatch(`/${createResp.asset_id}/`, { is_uploaded: true });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              asset_id: createResp.asset_id,
              message: 'Workspace logo uploaded and set',
            }, null, 2),
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── User Theme ────────────────────────────────────────────────

  server.tool(
    'plane-user-profile-get',
    'Get the current user profile (display name, avatar, theme, onboarding state).',
    {},
    async () => {
      try {
        const data = await planeClient.get('/../../users/me/profile/');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  server.tool(
    'plane-user-profile-update',
    'Update the current user profile (display name, theme preferences).',
    {
      display_name: z.string().optional().describe('Display name'),
      theme: z.record(z.unknown()).optional().describe('Theme object (e.g., {"theme": "dark"})'),
    },
    async (body) => {
      try {
        const filtered = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
        const data = await planeClient.patch('/../../users/me/profile/', filtered);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
