import { describe, it, expect, vi } from 'vitest';
import { resolveTodosBlock } from '../resolve-todos';
import type { TodosBlock } from '../types';

const REF = new Date(2026, 2, 25); // 2026-03-25 Wednesday
const INSTANCE_ID = 'inst-1';
const USER_ID = 'user-1';

// Builds a chainable Supabase mock.
// `tableData` maps table name → array of rows returned by that table.
function makeMock(tableData: Record<string, unknown[]>) {
  const builder = () => {
    const chain: Record<string, unknown> = {};
    const addChain = (obj: Record<string, unknown>) => {
      const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order', 'limit'];
      methods.forEach((m) => {
        obj[m] = vi.fn(() => obj);
      });
    };
    addChain(chain);
    return chain;
  };

  // Track the last "from" table so we can return the right data
  let currentTable = '';
  const mockChain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order'];
  methods.forEach((m) => {
    mockChain[m] = vi.fn(() => mockChain);
  });
  mockChain['limit'] = vi.fn(() =>
    Promise.resolve({ data: tableData[currentTable] ?? [], error: null })
  );

  const supabase = {
    from: vi.fn((table: string) => {
      currentTable = table;
      return mockChain;
    }),
  };

  return { supabase, mockChain };
}

const baseTodosBlock = (overrides: Partial<TodosBlock['query']> = {}): TodosBlock => ({
  type: 'todos',
  query: { filter: 'due_today', ...overrides },
});

describe('resolveTodosBlock', () => {
  it('returns markdown checklist for due_today results', async () => {
    const { supabase } = makeMock({
      todos: [
        { id: '1', title: 'Buy milk', is_completed: false, due_date: '2026-03-25', priority: 0, todo_projects: null },
      ],
    });

    const result = await resolveTodosBlock(
      baseTodosBlock({ filter: 'due_today' }),
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.type).toBe('markdown');
    expect(result.content).toContain('- [ ] Buy milk');
  });

  it('returns "*No items found.*" for empty results', async () => {
    const { supabase } = makeMock({ todos: [] });

    const result = await resolveTodosBlock(
      baseTodosBlock(),
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('*No items found.*');
  });

  it('includes title heading when block.title is set', async () => {
    const { supabase } = makeMock({ todos: [] });

    const result = await resolveTodosBlock(
      { ...baseTodosBlock(), title: 'My Tasks' },
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('## My Tasks');
  });

  it('includes priority label when show_priority is true and priority > 0', async () => {
    const { supabase } = makeMock({
      todos: [
        { id: '1', title: 'Important task', is_completed: false, due_date: '2026-03-25', priority: 3, todo_projects: null },
      ],
    });

    const result = await resolveTodosBlock(
      { ...baseTodosBlock(), show_priority: true },
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('`P3`');
  });

  it('omits priority label when priority is 0 even if show_priority is true', async () => {
    const { supabase } = makeMock({
      todos: [
        { id: '1', title: 'Low key task', is_completed: false, due_date: '2026-03-25', priority: 0, todo_projects: null },
      ],
    });

    const result = await resolveTodosBlock(
      { ...baseTodosBlock(), show_priority: true },
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).not.toMatch(/`P\d`/);
  });

  it('includes project name when show_project is true', async () => {
    const { supabase } = makeMock({
      todos: [
        {
          id: '1', title: 'Task A', is_completed: false, due_date: '2026-03-25', priority: 0,
          todo_projects: { name: 'Work' },
        },
      ],
    });

    const result = await resolveTodosBlock(
      { ...baseTodosBlock(), show_project: true },
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('*Work*');
  });

  it('resolves project_name before filtering', async () => {
    // First call returns a project, second returns todos
    let callCount = 0;
    const supabase = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order'];
        methods.forEach((m) => { chain[m] = vi.fn(() => chain); });
        chain['limit'] = vi.fn(() =>
          Promise.resolve({
            data: callCount === 1
              ? [{ id: 'proj-1' }]                 // project lookup
              : [{ id: '1', title: 'Proj task', is_completed: false, due_date: '2026-03-25', priority: 0, todo_projects: null }],
            error: null,
          })
        );
        return chain;
      }),
    };

    const result = await resolveTodosBlock(
      baseTodosBlock({ project_name: 'Work' }),
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('- [ ] Proj task');
    expect(supabase.from).toHaveBeenCalledWith('todo_projects');
    expect(supabase.from).toHaveBeenCalledWith('todos');
  });

  it('returns "No project named..." when project_name not found', async () => {
    // First query (todo_projects) returns empty; todos query never reached
    let callCount = 0;
    const supabase = {
      from: vi.fn(() => {
        callCount++;
        const chain: Record<string, unknown> = {};
        const methods = ['select', 'eq', 'ilike', 'lt', 'lte', 'gte', 'gt', 'order'];
        methods.forEach((m) => { chain[m] = vi.fn(() => chain); });
        chain['limit'] = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chain;
      }),
    };

    const result = await resolveTodosBlock(
      baseTodosBlock({ project_name: 'Nonexistent' }),
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('No project named "Nonexistent" found');
    expect(callCount).toBe(1); // only project lookup, no todos query
  });

  it('marks completed todos with [x]', async () => {
    const { supabase } = makeMock({
      todos: [
        { id: '1', title: 'Done task', is_completed: true, due_date: '2026-03-25', priority: 0, todo_projects: null },
      ],
    });

    const result = await resolveTodosBlock(
      baseTodosBlock({ include_completed: true }),
      supabase as never,
      INSTANCE_ID,
      USER_ID,
      REF
    );

    expect(result.content).toContain('- [x] Done task');
  });
});
