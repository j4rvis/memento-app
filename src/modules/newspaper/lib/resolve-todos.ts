import type { SupabaseClient } from '@supabase/supabase-js';
import type { TodosBlock, MarkdownBlock } from './types';
import { resolveDate } from './resolve-date';

const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function resolveTodosBlock(
  block: TodosBlock,
  supabase: SupabaseClient,
  instanceId: string,
  userId: string,
  ref?: Date
): Promise<MarkdownBlock> {
  const today = resolveDate('today', ref);
  const weekEnd = resolveDate('week-end', ref);

  // Resolve project_name → project_id
  let projectId: string | null = null;
  if (block.query.project_name) {
    const { data: projects } = await supabase
      .from('todo_projects')
      .select('id')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .ilike('name', block.query.project_name)
      .limit(1);

    if (!projects || projects.length === 0) {
      return toMarkdown(
        block.title,
        `*No project named "${block.query.project_name}" found.*`
      );
    }
    projectId = projects[0].id;
  }

  const limit = Math.min(block.query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const { filter, include_completed } = block.query;
  const excludeCompleted = filter === 'overdue' || !include_completed;

  let query = supabase
    .from('todos')
    .select('id, title, is_completed, due_date, priority, todo_projects(name)')
    .eq('instance_id', instanceId)
    .eq('user_id', userId);

  if (excludeCompleted) {
    query = query.eq('is_completed', false);
  }

  switch (filter) {
    case 'due_today':
      query = query.eq('due_date', today);
      break;
    case 'due_this_week':
      query = query.gte('due_date', today).lte('due_date', weekEnd);
      break;
    case 'overdue':
      query = query.lt('due_date', today);
      break;
    case 'upcoming':
      query = query.gt('due_date', today).order('due_date', { ascending: true });
      break;
    case 'all':
      break;
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (filter !== 'upcoming') {
    query = query.order('due_date', { ascending: true, nullsFirst: false });
  }

  query = query.limit(limit);

  const { data: todos } = await query;

  if (!todos || todos.length === 0) {
    return toMarkdown(block.title, '*No items found.*');
  }

  const lines = todos.map((todo) => {
    const check = todo.is_completed ? '[x]' : '[ ]';
    let line = `- ${check} ${todo.title}`;

    if (block.show_priority && todo.priority && todo.priority > 0) {
      const label = PRIORITY_LABELS[todo.priority];
      if (label) line += ` \`${label}\``;
    }

    if (block.show_project) {
      const project = Array.isArray(todo.todo_projects)
        ? todo.todo_projects[0]
        : todo.todo_projects;
      if (project?.name) line += ` *${project.name}*`;
    }

    return line;
  });

  return toMarkdown(block.title, lines.join('\n'));
}

function toMarkdown(title: string | undefined, body: string): MarkdownBlock {
  const heading = title ? `## ${title}\n\n` : '';
  return { type: 'markdown', content: `${heading}${body}` };
}
