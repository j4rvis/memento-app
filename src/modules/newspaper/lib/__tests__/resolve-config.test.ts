import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NewspaperConfig } from '../types';

// Mock external dependencies before importing resolveConfig
vi.mock('@/modules/google-calendar/lib/sync', () => ({
  syncCalendar: vi.fn().mockResolvedValue(undefined),
  syncCalendarList: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../resolve-google-sources', () => ({
  resolveGoogleCalendarSources: vi.fn().mockResolvedValue([]),
  resolveCalendarNames: vi.fn().mockImplementation((sources: unknown[]) =>
    Promise.resolve(sources)
  ),
}));

// Import after mocks are set up
const { resolveConfig } = await import('../resolve-config');
const { resolveCalendarNames, resolveGoogleCalendarSources } = await import('../resolve-google-sources');

const REF = new Date(2026, 2, 25); // 2026-03-25 Wednesday
const INSTANCE_ID = 'inst-1';
const USER_ID = 'user-1';

const baseConfig: NewspaperConfig = {
  title: 'Test Paper',
  pages: [],
};

// Build a minimal mock Supabase client
function makeMockSupabase(tableData: Record<string, unknown[]> = {}) {
  let currentTable = '';
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order'];
  methods.forEach((m) => { chain[m] = vi.fn(() => chain); });
  chain['limit'] = vi.fn(() =>
    Promise.resolve({ data: tableData[currentTable] ?? [], error: null })
  );
  return {
    from: vi.fn((table: string) => { currentTable = table; return chain; }),
  };
}

const ctx = (overrides = {}) => ({
  supabase: makeMockSupabase() as never,
  instanceId: INSTANCE_ID,
  userId: USER_ID,
  referenceDate: REF,
  ...overrides,
});

describe('resolveConfig', () => {
  beforeEach(() => {
    vi.mocked(resolveCalendarNames).mockImplementation((sources) =>
      Promise.resolve(sources)
    );
    vi.mocked(resolveGoogleCalendarSources).mockResolvedValue([]);
  });

  it('resolves config.date "today" to ISO string', async () => {
    const result = await resolveConfig({ ...baseConfig, date: 'today' }, ctx());
    expect(result.date).toBe('2026-03-25');
  });

  it('passes through a hardcoded ISO date unchanged', async () => {
    const result = await resolveConfig({ ...baseConfig, date: '2025-01-15' }, ctx());
    expect(result.date).toBe('2025-01-15');
  });

  it('defaults config.date to today when undefined', async () => {
    const result = await resolveConfig(baseConfig, ctx());
    expect(result.date).toBe('2026-03-25');
  });

  it('resolves calendar-day block date "tomorrow"', async () => {
    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'single',
        blocks: [{ type: 'calendar-day', date: 'tomorrow' }],
      }],
    };

    const result = await resolveConfig(config, ctx());
    const block = result.pages[0].blocks![0] as { date: string };
    expect(block.date).toBe('2026-03-26');
  });

  it('resolves calendar-week block start_date "week-start"', async () => {
    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'single',
        blocks: [{ type: 'calendar-week', start_date: 'week-start' }],
      }],
    };

    const result = await resolveConfig(config, ctx());
    const block = result.pages[0].blocks![0] as { start_date: string };
    expect(block.start_date).toBe('2026-03-23');
  });

  it('replaces todos block with a MarkdownBlock', async () => {
    const supabase = makeMockSupabase({
      todos: [
        { id: '1', title: 'Task A', is_completed: false, due_date: '2026-03-25', priority: 0, todo_projects: null },
      ],
    });

    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'single',
        blocks: [{ type: 'todos', query: { filter: 'due_today' } }],
      }],
    };

    const result = await resolveConfig(config, ctx({ supabase: supabase as never }));
    const block = result.pages[0].blocks![0];
    expect(block.type).toBe('markdown');
    expect((block as { content: string }).content).toContain('Task A');
  });

  it('replaces articles block with a MarkdownBlock', async () => {
    const supabase = makeMockSupabase({
      articles: [
        { id: '1', title: 'Article A', url: 'https://example.com', excerpt: null, site_name: null, created_at: '2026-03-25' },
      ],
    });

    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'single',
        blocks: [{ type: 'articles', query: { filter: 'unread' } }],
      }],
    };

    const result = await resolveConfig(config, ctx({ supabase: supabase as never }));
    const block = result.pages[0].blocks![0];
    expect(block.type).toBe('markdown');
    expect((block as { content: string }).content).toContain('Article A');
  });

  it('calls resolveCalendarNames when google_calendar_sources present', async () => {
    const config: NewspaperConfig = {
      ...baseConfig,
      google_calendar_sources: [{ account_id: 'acc-1', calendar_names: ['Work'] }],
    };

    await resolveConfig(config, ctx());
    expect(resolveCalendarNames).toHaveBeenCalledWith(
      config.google_calendar_sources,
      expect.anything()
    );
  });

  it('passes non-dynamic blocks through unchanged', async () => {
    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'single',
        blocks: [
          { type: 'markdown', content: '## Hello' },
          { type: 'divider', style: 'solid' },
          { type: 'spacer', height_mm: 10 },
        ],
      }],
    };

    const result = await resolveConfig(config, ctx());
    expect(result.pages[0].blocks).toEqual(config.pages[0].blocks);
  });

  it('resolves blocks in all columns of a multi-column page', async () => {
    const config: NewspaperConfig = {
      ...baseConfig,
      pages: [{
        layout: 'two-column',
        columns: [
          [{ type: 'calendar-day', date: 'today' }],
          [{ type: 'calendar-week', start_date: 'week-start' }],
        ],
      }],
    };

    const result = await resolveConfig(config, ctx());
    const col0Block = result.pages[0].columns![0][0] as { date: string };
    const col1Block = result.pages[0].columns![1][0] as { start_date: string };
    expect(col0Block.date).toBe('2026-03-25');
    expect(col1Block.start_date).toBe('2026-03-23');
  });

  it('merges google calendar entries into calendar_entries', async () => {
    vi.mocked(resolveGoogleCalendarSources).mockResolvedValue([
      { id: 'ev-1', title: 'Team Standup', start_at: '2026-03-25T09:00:00', end_at: '2026-03-25T09:30:00', all_day: false },
    ]);

    const config: NewspaperConfig = {
      ...baseConfig,
      calendar_entries: [
        { title: 'Existing entry', start_at: '2026-03-25T08:00:00', end_at: '2026-03-25T08:30:00', all_day: false },
      ],
      google_calendar_sources: [{ account_id: 'acc-1', calendar_ids: ['cal-1'] }],
    };

    const result = await resolveConfig(config, ctx());
    expect(result.calendar_entries).toHaveLength(2);
    expect(result.calendar_entries![1].title).toBe('Team Standup');
  });
});
