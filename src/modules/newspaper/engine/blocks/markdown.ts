import { marked } from 'marked';
import type { MarkdownBlock } from '../../lib/types';

// Configure marked for GFM support
marked.setOptions({ gfm: true });

export async function renderMarkdown(block: MarkdownBlock): Promise<string> {
  const html = await marked.parse(block.content);
  return `<div class="block-markdown">${html}</div>`;
}
