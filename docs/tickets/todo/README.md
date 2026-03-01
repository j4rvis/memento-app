# Tickets: Todo

This folder is a **staging area** for tickets that Claude has planned but the user hasn't yet approved for implementation.

## Flow

```
todo/ → (user reviews & approves) → backlog/ → (Claude implements) → done/
```

- **todo/**: Claude-authored planning tickets. Review, edit, or delete before promoting.
- **backlog/**: Approved tickets ready for Claude to pick up and implement.
- **done/**: Completed tickets with implementation summary.

To promote a ticket, move it from `todo/` to `backlog/` and Claude will pick it up in the next session.
