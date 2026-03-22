import { describe, it, expect } from 'vitest';
import { configToHtml } from '../config-to-html';
import type { NewspaperConfig } from '../../lib/types';

const baseConfig: NewspaperConfig = {
  title: 'Test Paper',
  pages: [],
};

describe('configToHtml', () => {
  describe('theme: classic', () => {
    it('does not include a Google Fonts link', async () => {
      const html = await configToHtml({ ...baseConfig, theme: 'classic' });
      expect(html).not.toContain('fonts.googleapis.com');
    });

    it('includes classic CSS variables', async () => {
      const html = await configToHtml({ ...baseConfig, theme: 'classic' });
      expect(html).toContain('--np-font-heading');
      expect(html).toContain('--np-text');
    });
  });

  describe('theme: broadsheet', () => {
    it('includes a Google Fonts link', async () => {
      const html = await configToHtml({ ...baseConfig, theme: 'broadsheet' });
      expect(html).toContain('fonts.googleapis.com');
    });

    it('includes broadsheet CSS variables', async () => {
      const html = await configToHtml({ ...baseConfig, theme: 'broadsheet' });
      expect(html).toContain('--np-font-heading');
      expect(html).toContain('--np-text');
    });
  });

  describe('single-layout page', () => {
    it('renders a page div with block content', async () => {
      const config: NewspaperConfig = {
        ...baseConfig,
        pages: [
          {
            layout: 'single',
            blocks: [{ type: 'markdown', content: 'Hello world' }],
          },
        ],
      };
      const html = await configToHtml(config);
      expect(html).toContain('<div class="page">');
      expect(html).toContain('Hello world');
    });
  });

  describe('two-column layout', () => {
    it('renders columns-2 wrapper with two column divs', async () => {
      const config: NewspaperConfig = {
        ...baseConfig,
        pages: [
          {
            layout: 'two-column',
            columns: [
              [{ type: 'markdown', content: 'Left' }],
              [{ type: 'markdown', content: 'Right' }],
            ],
          },
        ],
      };
      const html = await configToHtml(config);
      expect(html).toContain('class="columns-2"');
      const columnMatches = html.match(/class="column"/g);
      expect(columnMatches).toHaveLength(2);
    });
  });
});
