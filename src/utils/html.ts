import { Marked } from 'marked';

const marked = new Marked();

/**
 * Convert markdown to Plane-compatible HTML.
 * Plane's TipTap editor expects specific CSS classes on elements.
 */
export function markdownToPlaneHtml(markdown: string): string {
  const raw = marked.parse(markdown) as string;
  return addPlaneEditorClasses(raw);
}

/**
 * Add Plane editor CSS classes to raw HTML so it renders correctly in the TipTap editor.
 *
 * Plane expects:
 *   <h1-h6 class="editor-heading-block">
 *   <p class="editor-paragraph-block">
 *   <blockquote class="editor-blockquote-block">
 *   <pre><code class="language-xxx"> (pass-through, already correct from marked)
 *   <table>, <ul>, <ol> (pass-through, work as-is)
 */
export function addPlaneEditorClasses(html: string): string {
  let result = html;

  // Add heading classes (h1–h6)
  result = result.replace(
    /<(h[1-6])(\s[^>]*)?>/gi,
    (match, tag, attrs) => {
      attrs = attrs || '';
      if (attrs.includes('editor-heading-block')) return match;
      return `<${tag} class="editor-heading-block"${attrs}>`;
    }
  );

  // Add paragraph classes
  result = result.replace(
    /<p(\s[^>]*)?>/gi,
    (match, attrs) => {
      attrs = attrs || '';
      if (attrs.includes('editor-paragraph-block')) return match;
      return `<p class="editor-paragraph-block"${attrs}>`;
    }
  );

  // Add blockquote classes
  result = result.replace(
    /<blockquote(\s[^>]*)?>/gi,
    (match, attrs) => {
      attrs = attrs || '';
      if (attrs.includes('editor-blockquote-block')) return match;
      return `<blockquote class="editor-blockquote-block"${attrs}>`;
    }
  );

  return result;
}

/**
 * Build an <image-component> element for embedding an uploaded asset in a page.
 * Plane's TipTap editor uses this custom element to render images.
 */
export function buildImageComponent(opts: {
  assetId: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
}): string {
  const { assetId, width = 800, height = 600, alignment = 'center' } = opts;
  const aspectRatio = (width / height).toFixed(2);
  const nodeId = crypto.randomUUID();
  return `<image-component src="${assetId}" id="${nodeId}" width="${width}" height="${height}" aspectratio="${aspectRatio}" alignment="${alignment}" status="uploaded"></image-component>`;
}

/**
 * Strip Plane editor classes from HTML to get clean, readable HTML.
 */
export function stripPlaneClasses(html: string): string {
  return html
    .replace(/\s*class="editor-heading-block"/g, '')
    .replace(/\s*class="editor-paragraph-block"/g, '')
    .replace(/\s*class="editor-blockquote-block"/g, '');
}

/**
 * Extract plain text from HTML (for summaries, search, etc.)
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<image-component[^>]*><\/image-component>/g, '[image]')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
