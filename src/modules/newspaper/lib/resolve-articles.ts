import type { SupabaseClient } from '@supabase/supabase-js';
import type { ArticlesBlock, MarkdownBlock } from './types';
import { resolveDate } from './resolve-date';

const DEFAULT_LIMIT = 10;

export async function resolveArticlesBlock(
  block: ArticlesBlock,
  supabase: SupabaseClient,
  instanceId: string,
  userId: string,
  ref?: Date
): Promise<MarkdownBlock> {
  const today = resolveDate('today', ref);
  const weekStart = resolveDate('week-start', ref);

  // Resolve tag_name → tag_id
  let tagId: string | null = null;
  if (block.query.tag_name) {
    const { data: tags } = await supabase
      .from('article_tags')
      .select('id')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .ilike('name', block.query.tag_name)
      .limit(1);

    if (!tags || tags.length === 0) {
      return toMarkdown(
        block.title,
        `*No tag named "${block.query.tag_name}" found.*`
      );
    }
    tagId = tags[0].id;
  }

  const limit = block.query.limit ?? DEFAULT_LIMIT;
  const { filter } = block.query;

  let query = supabase
    .from('articles')
    .select('id, title, url, excerpt, site_name, created_at')
    .eq('instance_id', instanceId)
    .eq('user_id', userId)
    .eq('is_archived', false);

  switch (filter) {
    case 'unread':
      query = query.eq('is_read', false);
      break;
    case 'saved_today':
      query = query.gte('created_at', `${today}T00:00:00`);
      break;
    case 'saved_this_week':
      query = query.gte('created_at', `${weekStart}T00:00:00`);
      break;
    case 'recent':
    case 'all':
      break;
  }

  if (tagId) {
    query = query.eq('tag_id', tagId);
  }

  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data: articles } = await query;

  if (!articles || articles.length === 0) {
    return toMarkdown(block.title, '*No articles found.*');
  }

  const lines = articles.flatMap((article) => {
    const title = (article.title as string | null) ?? (article.url as string);
    const url = article.url as string;
    let line = `- [${title}](${url})`;

    if (block.show_site && article.site_name) {
      line += ` — ${article.site_name}`;
    }

    const result = [line];

    if (block.show_excerpt && article.excerpt) {
      const excerpt = (article.excerpt as string).slice(0, 120);
      result.push(`  > ${excerpt}`);
    }

    return result;
  });

  return toMarkdown(block.title, lines.join('\n'));
}

function toMarkdown(title: string | undefined, body: string): MarkdownBlock {
  const heading = title ? `## ${title}\n\n` : '';
  return { type: 'markdown', content: `${heading}${body}` };
}
