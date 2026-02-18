export const queryKeys = {
  instance: (instanceId: string) => ["instance", instanceId] as const,

  todos: {
    all: (instanceId: string) => ["todos", instanceId] as const,
    list: (instanceId: string, projectFilter?: string) =>
      ["todos", instanceId, "list", { project: projectFilter }] as const,
    projects: (instanceId: string) =>
      ["todos", instanceId, "projects"] as const,
  },

  notes: {
    all: (instanceId: string) => ["notes", instanceId] as const,
    list: (instanceId: string) => ["notes", instanceId, "list"] as const,
    detail: (instanceId: string, noteId: string) =>
      ["notes", instanceId, "detail", noteId] as const,
    folders: (instanceId: string) => ["notes", instanceId, "folders"] as const,
  },

  feeds: {
    all: (instanceId: string) => ["feeds", instanceId] as const,
    list: (instanceId: string) => ["feeds", instanceId, "list"] as const,
    entries: (instanceId: string, feedId?: string) =>
      ["feeds", instanceId, "entries", { feedId }] as const,
    unreadCounts: (instanceId: string) =>
      ["feeds", instanceId, "unreadCounts"] as const,
  },

  articles: {
    all: (instanceId: string) => ["articles", instanceId] as const,
    list: (instanceId: string, tagId?: string) =>
      ["articles", instanceId, "list", { tagId }] as const,
    counts: (instanceId: string) =>
      ["articles", instanceId, "counts"] as const,
    tags: (instanceId: string) => ["articles", instanceId, "tags"] as const,
  },

  newspapers: {
    all: (instanceId: string) => ["newspapers", instanceId] as const,
    list: (instanceId: string) =>
      ["newspapers", instanceId, "list"] as const,
    detail: (instanceId: string, newspaperId: string) =>
      ["newspapers", instanceId, "detail", newspaperId] as const,
    blocks: (instanceId: string, newspaperId: string) =>
      ["newspapers", instanceId, "blocks", newspaperId] as const,
  },
} as const;
