import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface AssetCreateResponse {
  asset_id: string;
  asset_url: string;
  upload_data: {
    url: string;
    fields: Record<string, string>;
  };
}

export function registerAssetTools(server: McpServer): void {

  // ── Upload ────────────────────────────────────────────────────

  server.tool(
    'plane-asset-upload',
    `Upload a file to Plane and get an asset UUID back. Supports local file paths or base64 data.
The returned asset_id can be used with plane-page-insert-image to embed images in pages.
3-step presigned upload: create record → upload to storage → mark complete.
Max file size: 5 MB.`,
    {
      project_id: z.string().uuid().describe('Project UUID'),
      entity_type: z.enum(['PAGE_DESCRIPTION', 'ISSUE_DESCRIPTION', 'ISSUE_ATTACHMENT'])
        .default('PAGE_DESCRIPTION')
        .describe('What the asset is attached to'),
      entity_id: z.string().uuid().describe('Entity UUID (page_id or issue_id)'),
      file_path: z.string().optional().describe('Absolute path to local file (use this OR file_base64)'),
      file_base64: z.string().optional().describe('Base64-encoded file content (use this OR file_path)'),
      file_name: z.string().optional().describe('File name (required with file_base64, auto-detected from file_path)'),
      content_type: z.string().optional().describe('MIME type (auto-detected from file name if omitted)'),
    },
    async ({ project_id, entity_type, entity_id, file_path: filePath, file_base64, file_name, content_type }) => {
      try {
        // Resolve file content
        let fileBuffer: Buffer;
        let fileName: string;
        let mimeType: string;

        if (filePath) {
          fileBuffer = await fs.readFile(filePath);
          fileName = file_name || path.basename(filePath);
          mimeType = content_type || mime.lookup(fileName) || 'application/octet-stream';
        } else if (file_base64) {
          if (!file_name) throw new Error('file_name is required when using file_base64');
          fileBuffer = Buffer.from(file_base64, 'base64');
          fileName = file_name;
          mimeType = content_type || mime.lookup(fileName) || 'application/octet-stream';
        } else {
          throw new Error('Provide either file_path or file_base64');
        }

        if (fileBuffer.length > 5 * 1024 * 1024) {
          throw new Error(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB (max 5 MB)`);
        }

        logger.info('Uploading asset', { fileName, mimeType, size: fileBuffer.length, entity_type });

        // Step 1: Create asset record → get presigned URL
        const createResp = await planeClient.assetCreate<AssetCreateResponse>(
          `/projects/${project_id}/`,
          { entity_type, entity_identifier: entity_id, type: mimeType }
        );

        const { asset_id, upload_data } = createResp;
        logger.info('Asset record created', { asset_id, uploadUrl: upload_data.url });

        // Step 2: Upload file to presigned URL
        await planeClient.uploadToPresigned(
          upload_data.url,
          upload_data.fields,
          fileBuffer,
          fileName,
          mimeType,
        );
        logger.info('File uploaded to storage');

        // Step 3: Mark upload complete
        await planeClient.assetPatch(`/projects/${project_id}/${asset_id}/`, { is_uploaded: true });
        logger.info('Asset marked complete', { asset_id });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              asset_id,
              file_name: fileName,
              content_type: mimeType,
              size_bytes: fileBuffer.length,
              message: 'Upload complete. Use this asset_id with plane-page-insert-image to embed in a page.',
            }, null, 2),
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Delete ────────────────────────────────────────────────────

  server.tool(
    'plane-asset-delete',
    'Delete an uploaded asset from the workspace.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      asset_id: z.string().uuid().describe('Asset UUID'),
    },
    async ({ project_id, asset_id }) => {
      try {
        await planeClient.assetPatch(`/projects/${project_id}/${asset_id}/`, { is_deleted: true });
        return { content: [{ type: 'text', text: `Asset ${asset_id} deleted` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
