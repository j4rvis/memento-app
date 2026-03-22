# OpenSpec Commands (`/opsx`)

A spec-driven development workflow for planning and implementing changes with AI assistance.

## Overview

The `opsx` commands guide you through a structured cycle:

```
/opsx:explore  →  /opsx:propose  →  /opsx:apply  →  /opsx:archive
  (think)           (plan)           (build)          (close)
```

Changes live in `openspec/changes/<name>/` and contain artifacts like `proposal.md`, `design.md`, and `tasks.md`.

---

## Commands

### `/opsx:explore [topic]`

A thinking partner. Use this **before** you know what you want to build.

- Investigates the codebase, surfaces trade-offs, draws diagrams
- Will **not** write code — exploration only
- Can capture decisions into OpenSpec artifacts if you ask

**Examples:**
```
/opsx:explore real-time collaboration
/opsx:explore the auth system feels messy
/opsx:explore add-dark-mode          # explore an existing change
/opsx:explore                        # open-ended, no topic
```

---

### `/opsx:propose [name or description]`

Creates a new change and generates all planning artifacts in one step.

Produces:
- `proposal.md` — what & why
- `design.md` — how
- `tasks.md` — implementation steps

Once complete, the change is ready for `/opsx:apply`.

**Examples:**
```
/opsx:propose add-user-notifications
/opsx:propose I want to add CSV export to the articles module
/opsx:propose                        # will ask what you want to build
```

---

### `/opsx:apply [name]`

Implements the tasks in a change, one by one.

- Reads all context artifacts before starting
- Shows progress as `N/M tasks complete`
- Marks each task done as it goes (`- [ ]` → `- [x]`)
- Pauses if a task is unclear or a design issue is discovered

**Examples:**
```
/opsx:apply add-user-notifications
/opsx:apply                          # auto-selects if only one active change
```

---

### `/opsx:archive [name]`

Archives a completed change.

- Warns if tasks or artifacts are incomplete (but lets you proceed)
- Offers to sync delta specs back to main specs
- Moves the change to `openspec/changes/archive/YYYY-MM-DD-<name>/`

**Examples:**
```
/opsx:archive add-user-notifications
/opsx:archive                        # prompts you to select a change
```

---

## Typical Workflow

```
# 1. Think through the idea
/opsx:explore I want to add a tagging system to notes

# 2. Create a proposal and tasks
/opsx:propose add-note-tags

# 3. Implement
/opsx:apply add-note-tags

# 4. Archive when done
/opsx:archive add-note-tags
```

You can also skip explore and go straight to propose, or re-enter any step (e.g. run `/opsx:apply` again to continue after a pause).
