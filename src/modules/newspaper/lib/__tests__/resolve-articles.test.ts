import { describe, it, expect, vi } from 'vitest';
import { resolveArticlesBlock } from '../resolve-articles';
import type { ArticlesBlock } from '../types';

const REF = new Date(2026, 2, 25); // 2026-03-25
const INSTANCE_ID = 'inst-1';
const USER_ID = 'user-1';

const baseBlock = (overrides: Partial<ArticlesBlock['query']> = {}): ArticlesBlock => ({
  type: 'articles',
  query: { filter: 'unread', ...overrides },
});

// Builds a simple mock where all table queries resolve to the given articles rows.
// For tag lookups (article_tags table), returns the tagRow if provided.
function makeMock(articles: unknown[], tagRow?: { id: string }) {
  let tableCallCount = 0;
  const supabase = {
    from: vi.fn((table: string) => {
      tableCallCount++;
      const isTagLookup = table === 'article_tags';
      const chain: Record<string, unknown> = {};
      const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order'];
      methods.forEach((m) => { chain[m] = vi.fn(() => chain); });
      chain['limit'] = vi.fn(() =>
        Promise.resolve({
          data: isTagLookup ? (tagRow ? [tagRow] : []) : articles,
          error: null,
        })
      );
      return chain;
    }),
  };
  return { supabase, getCallCount: () => tableCallCount };
}

describe('resolveArticlesBlock', () => {
  it('returns markdown list for unread articles', async () => {
    const { supabase } = makeMock([
      { id: '1', title: 'Great Article', url: 'https://example.com', excerpt: null, site_name: null, created_at: '2026-03-25T10:00:00Z' },
    ]);

    const result = await resolveArticlesBlock(baseBlock(), supabase as never, INSTANCE_ID, USER_ID, REF);

    expect(result.type).toBe('markdown');
    expect(result.content).toContain('[Great Article](https://example.com)');
  });

  it('uses URL as fallback when title is null', async () => {
    const { supabase } = makeMock([
      { id: '1', title: null, url: 'https://example.com/article', excerpt: null, site_name: null, created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(baseBlock(), supabase as never, INSTANCE_ID, USER_ID, REF);

    expect(result.content).toContain('[https://example.com/article](https://example.com/article)');
  });

  it('includes site name when show_site is true', async () => {
    const { supabase } = makeMock([
      { id: '1', title: 'Article', url: 'https://example.com', excerpt: null, site_name: 'Example', created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(
      { ...baseBlock(), show_site: true },
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).toContain('— Example');
  });

  it('omits site name when show_site is false (default)', async () => {
    const { supabase } = makeMock([
      { id: '1', title: 'Article', url: 'https://example.com', excerpt: null, site_name: 'Example', created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(baseBlock(), supabase as never, INSTANCE_ID, USER_ID, REF);

    expect(result.content).not.toContain('— Example');
  });

  it('includes excerpt when show_excerpt is true and excerpt exists', async () => {
    const { supabase } = makeMock([
      { id: '1', title: 'Article', url: 'https://example.com', excerpt: 'A short summary', site_name: null, created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(
      { ...baseBlock(), show_excerpt: true },
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).toContain('> A short summary');
  });

  it('skips excerpt line when excerpt is null', async () => {
    const { supabase } = makeMock([
      { id: '1', title: 'Article', url: 'https://example.com', excerpt: null, site_name: null, created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(
      { ...baseBlock(), show_excerpt: true },
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).not.toContain('>');
  });

  it('returns "*No articles found.*" for empty results', async () => {
    const { supabase } = makeMock([]);

    const result = await resolveArticlesBlock(baseBlock(), supabase as never, INSTANCE_ID, USER_ID, REF);

    expect(result.content).toContain('*No articles found.*');
  });

  it('includes title heading when block.title is set', async () => {
    const { supabase } = makeMock([]);

    const result = await resolveArticlesBlock(
      { ...baseBlock(), title: 'Reading List' },
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).toContain('## Reading List');
  });

  it('resolves tag_name to tag_id before filtering', async () => {
    const { supabase } = makeMock(
      [{ id: '1', title: 'Tagged Article', url: 'https://example.com', excerpt: null, site_name: null, created_at: '2026-03-25' }],
      { id: 'tag-1' }
    );

    const result = await resolveArticlesBlock(
      baseBlock({ tag_name: 'tech' }),
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).toContain('Tagged Article');
    expect(supabase.from).toHaveBeenCalledWith('article_tags');
    expect(supabase.from).toHaveBeenCalledWith('articles');
  });

  it('returns "No tag named..." when tag_name not found', async () => {
    const { supabase, getCallCount } = makeMock([], undefined);

    const result = await resolveArticlesBlock(
      baseBlock({ tag_name: 'ghost-tag' }),
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    expect(result.content).toContain('No tag named "ghost-tag" found');
    expect(getCallCount()).toBe(1); // only tag lookup, no articles query
  });

  it('truncates excerpt at 120 characters', async () => {
    const longExcerpt = 'a'.repeat(200);
    const { supabase } = makeMock([
      { id: '1', title: 'Article', url: 'https://example.com', excerpt: longExcerpt, site_name: null, created_at: '2026-03-25' },
    ]);

    const result = await resolveArticlesBlock(
      { ...baseBlock(), show_excerpt: true },
      supabase as never, INSTANCE_ID, USER_ID, REF
    );

    // Excerpt should be at most 120 chars
    const excerptMatch = result.content.match(/> (.+)/);
    expect(excerptMatch![1].length).toBeLessThanOrEqual(120);
  });
});
