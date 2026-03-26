import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planeClient } from '../client.js';
import { formatErrorForMcp } from '../utils/errors.js';
import { markdownToPlaneHtml, addPlaneEditorClasses, stripPlaneClasses, htmlToText, buildImageComponent } from '../utils/html.js';

export function registerPageTools(server: McpServer): void {

  // ── List ──────────────────────────────────────────────────────

  server.tool(
    'plane-page-list',
    'List all pages in a project.',
    { project_id: z.string().uuid().describe('Project UUID') },
    async ({ project_id }) => {
      try {
        const data = await planeClient.get(`/projects/${project_id}/pages/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Detail (metadata + readable content) ──────────────────────

  server.tool(
    'plane-page-detail',
    'Get page metadata AND readable HTML content. Returns the page object with description_html (the actual content), not the Yjs binary.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
    },
    async ({ project_id, page_id }) => {
      try {
        const data = await planeClient.get<Record<string, unknown>>(`/projects/${project_id}/pages/${page_id}/`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Get Content (readable HTML) ───────────────────────────────

  server.tool(
    'plane-page-get-content',
    'Get the readable HTML content of a page. Returns the description_html field from the page model (NOT the Yjs binary endpoint). Optionally strips Plane editor classes for cleaner reading.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
      strip_classes: z.boolean().default(false).describe('Strip editor CSS classes for cleaner output'),
      as_text: z.boolean().default(false).describe('Return plain text instead of HTML'),
    },
    async ({ project_id, page_id, strip_classes, as_text }) => {
      try {
        const page = await planeClient.get<Record<string, unknown>>(`/projects/${project_id}/pages/${page_id}/`);
        let content = (page.description_html as string) || '';
        if (as_text) content = htmlToText(content);
        else if (strip_classes) content = stripPlaneClasses(content);
        return { content: [{ type: 'text', text: content || '(empty page)' }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Create (with optional content in one call) ────────────────

  server.tool(
    'plane-page-create',
    'Create a new page with optional content in one call. Accepts markdown (default) or HTML. Markdown is auto-converted to Plane-formatted HTML with proper editor classes.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      name: z.string().describe('Page title'),
      access: z.number().default(0).describe('0=public to workspace, 1=private'),
      content: z.string().optional().describe('Page body content (markdown by default, or HTML if format="html")'),
      format: z.enum(['markdown', 'html']).default('markdown').describe('Content format: "markdown" (default) or "html"'),
    },
    async ({ project_id, name, access, content, format }) => {
      try {
        // Step 1: Create the page
        const page = await planeClient.post<Record<string, unknown>>(`/projects/${project_id}/pages/`, { name, access });
        const pageId = page.id as string;

        // Step 2: Set content if provided
        if (content) {
          const html = format === 'markdown' ? markdownToPlaneHtml(content) : addPlaneEditorClasses(content);
          await planeClient.patch(`/projects/${project_id}/pages/${pageId}/description/`, { description_html: html });
        }

        return { content: [{ type: 'text', text: JSON.stringify(page, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Update (metadata) ─────────────────────────────────────────

  server.tool(
    'plane-page-update',
    'Update page metadata (title, access level).',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
      name: z.string().optional().describe('New title'),
      access: z.number().optional().describe('0=public, 1=private'),
    },
    async ({ project_id, page_id, ...body }) => {
      try {
        const data = await planeClient.patch(`/projects/${project_id}/pages/${page_id}/`, body);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Set Content (replace) ─────────────────────────────────────

  server.tool(
    'plane-page-set-content',
    'Replace the entire page body. Accepts markdown (default) or HTML. Markdown is auto-converted to Plane-formatted HTML with proper editor classes (headings, paragraphs, blockquotes).',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
      content: z.string().describe('New page body (markdown by default, or HTML if format="html")'),
      format: z.enum(['markdown', 'html']).default('markdown').describe('Content format'),
    },
    async ({ project_id, page_id, content, format }) => {
      try {
        const html = format === 'markdown' ? markdownToPlaneHtml(content) : addPlaneEditorClasses(content);
        const data = await planeClient.patch(`/projects/${project_id}/pages/${page_id}/description/`, { description_html: html });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Append Content ────────────────────────────────────────────

  server.tool(
    'plane-page-append-content',
    'Append content to the end of an existing page without replacing existing content. Accepts markdown (default) or HTML.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
      content: z.string().describe('Content to append'),
      format: z.enum(['markdown', 'html']).default('markdown').describe('Content format'),
    },
    async ({ project_id, page_id, content, format }) => {
      try {
        // Read existing content
        const page = await planeClient.get<Record<string, unknown>>(`/projects/${project_id}/pages/${page_id}/`);
        const existing = (page.description_html as string) || '';

        // Convert new content
        const newHtml = format === 'markdown' ? markdownToPlaneHtml(content) : addPlaneEditorClasses(content);

        // Append
        const combined = existing + newHtml;
        const data = await planeClient.patch(`/projects/${project_id}/pages/${page_id}/description/`, { description_html: combined });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Insert Image ──────────────────────────────────────────────

  server.tool(
    'plane-page-insert-image',
    'Insert an already-uploaded image asset into a page. Generates the proper <image-component> element and appends it to the page content. Upload the image first with plane-asset-upload.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
      asset_id: z.string().uuid().describe('Asset UUID from plane-asset-upload'),
      width: z.number().default(800).describe('Display width in pixels'),
      height: z.number().default(600).describe('Display height in pixels'),
      alignment: z.enum(['left', 'center', 'right']).default('center').describe('Image alignment'),
      caption: z.string().optional().describe('Optional caption text below the image'),
    },
    async ({ project_id, page_id, asset_id, width, height, alignment, caption }) => {
      try {
        const page = await planeClient.get<Record<string, unknown>>(`/projects/${project_id}/pages/${page_id}/`);
        const existing = (page.description_html as string) || '';

        let imageHtml = buildImageComponent({ assetId: asset_id, width, height, alignment });
        if (caption) {
          imageHtml += `\n<p class="editor-paragraph-block"><em>${caption}</em></p>`;
        }

        const combined = existing + imageHtml;
        await planeClient.patch(`/projects/${project_id}/pages/${page_id}/description/`, { description_html: combined });
        return { content: [{ type: 'text', text: `Image ${asset_id} inserted into page ${page_id}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );

  // ── Delete ────────────────────────────────────────────────────

  server.tool(
    'plane-page-delete',
    'Delete a page from a project.',
    {
      project_id: z.string().uuid().describe('Project UUID'),
      page_id: z.string().uuid().describe('Page UUID'),
    },
    async ({ project_id, page_id }) => {
      try {
        await planeClient.delete(`/projects/${project_id}/pages/${page_id}/`);
        return { content: [{ type: 'text', text: `Page ${page_id} deleted` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatErrorForMcp(error) }], isError: true };
      }
    }
  );
}
