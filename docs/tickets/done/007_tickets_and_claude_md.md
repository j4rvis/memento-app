- add a phrase in the claude md that if you are prompted to continue working on a ticket, you are checking the files in @docs/tickets/backlog/ and take the one with the fewest number in the ticket number. 007 is before 010 e.g.
- Once a ticket is fullfilled add a small summary and the date of completion and move it to the done folder. Complete a ticket after the review and commit the changes with the ticket name.
- Typical flow should be: reading the ticket - exloration - creating a plan and adding that plan to the ticket - ask qiestions if required - implement - await review - finalize ticket by moving it and creating a commit with the ticket name.
- add this flow to the claude.md
- this ticket can be the first example

## Summary

Added a `## Ticket Workflow` section to `CLAUDE.md` documenting how to pick the next ticket (lowest number in backlog) and the standard flow (read → explore → plan → ask → implement → review → finalize). This ticket itself served as the first live example of the flow.

Completed: 2026-03-01

## Plan

1. Add a `## Ticket Workflow` section to `CLAUDE.md` that documents:
   - How to pick the next ticket: check `docs/tickets/backlog/`, take the lowest-numbered file
   - The standard flow: read ticket → explore codebase → write plan into ticket → ask questions if needed → implement → await review → finalize
   - Finalization steps: append summary + completion date to ticket file, move file from `backlog/` to `done/`, commit with ticket name as message
2. This ticket (007) serves as the first live example of the flow
