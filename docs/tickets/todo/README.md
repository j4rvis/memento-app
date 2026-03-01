# Tickets: Todo

This folder contains tickets the user has **approved for implementation**. Claude picks these up and runs the full implementation flow.

## Flow

```
backlog/ → (user promotes) → todo/ → (Claude implements) → done/
```

- **backlog/**: Claude-planned tickets awaiting user review. Not ready to implement.
- **todo/**: User-approved tickets. Claude picks up the lowest-numbered one and implements it.
- **done/**: Completed tickets with implementation summary.
