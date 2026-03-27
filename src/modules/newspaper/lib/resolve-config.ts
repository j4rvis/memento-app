import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewspaperConfig, Block, MarkdownBlock } from './types';
import { resolveDate } from './resolve-date';
import { resolveTodosBlock } from './resolve-todos';
import { resolveArticlesBlock } from './resolve-articles';
import {
  resolveCalendarNames,
  resolveGoogleCalendarSources,
} from './resolve-google-sources';
import { syncCalendar, syncCalendarList } from '@/modules/google-calendar/lib/sync';

export interface ResolverContext {
  supabase: SupabaseClient;
  instanceId: string;
  userId: string;
  /** Injectable for testing; defaults to new Date() */
  referenceDate?: Date;
}

/**
 * Resolves a raw NewspaperConfig (which may contain dynamic DateExpr values,
 * TodosBlock, ArticlesBlock, and calendar_names) into a fully resolved config
 * ready for the render engine.
 *
 * Resolution order:
 *  1. Resolve calendar_names → calendar_ids (needed before sync)
 *  2. Sync Google Calendar events
 *  3. Fetch Google Calendar entries and merge into calendar_entries
 *  4. Resolve config.date
 *  5. Walk blocks and resolve TodosBlock, ArticlesBlock, and date fields
 */
export async function resolveConfig(
  raw: NewspaperConfig,
  ctx: ResolverContext
): Promise<NewspaperConfig> {
  const ref = ctx.referenceDate ?? new Date();
  let config = { ...raw };

  // 1. Resolve calendar_names → calendar_ids
  if (config.google_calendar_sources?.length) {
    config = {
      ...config,
      google_calendar_sources: await resolveCalendarNames(
        config.google_calendar_sources,
        ctx.supabase
      ),
    };
  }

  // 2. Sync Google Calendar events (using now-resolved calendar_ids)
  if (config.google_calendar_sources?.length) {
    await Promise.all([
      ...config.google_calendar_sources.map(({ account_id }) =>
        syncCalendarList(account_id, ctx.userId, ctx.instanceId)
      ),
      ...config.google_calendar_sources
        .filter((s) => s.calendar_ids?.length)
        .flatMap(({ account_id, calendar_ids }) =>
          (calendar_ids ?? []).map((calId) =>
            syncCalendar(account_id, calId, ctx.userId, ctx.instanceId)
          )
        ),
    ]);
  }

  // 3. Fetch Google Calendar entries and merge into calendar_entries
  const googleEntries = await resolveGoogleCalendarSources(config);
  config = {
    ...config,
    calendar_entries: [...(config.calendar_entries ?? []), ...googleEntries],
  };

  // 4. Resolve config.date
  config = { ...config, date: resolveDate(config.date, ref) };

  // 5. Resolve pages and their blocks
  const resolvedPages = await Promise.all(
    config.pages.map(async (page) => {
      if (page.layout === 'single') {
        return {
          ...page,
          blocks: await resolveBlocks(page.blocks ?? [], ctx, ref),
        };
      }
      return {
        ...page,
        columns: await Promise.all(
          (page.columns ?? []).map((col) => resolveBlocks(col, ctx, ref))
        ),
      };
    })
  );

  return { ...config, pages: resolvedPages };
}

async function resolveBlocks(
  blocks: Block[],
  ctx: ResolverContext,
  ref: Date
): Promise<Block[]> {
  return Promise.all(blocks.map((b) => resolveBlock(b, ctx, ref)));
}

async function resolveBlock(
  block: Block,
  ctx: ResolverContext,
  ref: Date
): Promise<Block> {
  switch (block.type) {
    case 'todos':
      return resolveTodosBlock(
        block,
        ctx.supabase,
        ctx.instanceId,
        ctx.userId,
        ref
      );

    case 'articles':
      return resolveArticlesBlock(
        block,
        ctx.supabase,
        ctx.instanceId,
        ctx.userId,
        ref
      );

    case 'calendar-day':
      return { ...block, date: resolveDate(block.date, ref) };

    case 'calendar-week':
      return { ...block, start_date: resolveDate(block.start_date, ref) };

    default:
      return block;
  }
}

/** Convenience: build a MarkdownBlock (used by resolvers) */
export function markdownBlock(content: string): MarkdownBlock {
  return { type: 'markdown', content };
}
