# 049 — Newspaper Scheduler

## Goal

Allow users to configure a schedule for automatic PDF generation. Generated PDFs are stored in Supabase Storage and optionally delivered to Kindle.

## Background

See `docs/story-newspaper.md`. Depends on ticket 047 (engine) and 048 (templates in DB).

## Database

### `newspaper_schedules`

```sql
create table newspaper_schedules (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references newspaper_templates(id) on delete cascade,
  instance_id       uuid not null references instances(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  cron_expression   text not null,           -- e.g. '0 6 * * *'
  timezone          text not null default 'UTC',
  enabled           boolean not null default true,
  delivery          jsonb not null default '{}',  -- DeliveryConfig
  last_run_at       timestamptz,
  last_pdf_path     text,                   -- Supabase Storage path
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

RLS: same pattern as templates (instance member read, owner write).

### `DeliveryConfig` shape

```typescript
interface DeliveryConfig {
  storage: {
    enabled: boolean;
    keep_last_n: number;   // default 7 — rotate older PDFs
  };
  kindle?: {
    enabled: boolean;
    email: string;         // foo@kindle.com
  };
}
```

## Supabase Storage

Bucket: `newspaper-pdfs` (private, RLS-gated or signed URLs).

Path pattern: `{instance_id}/{template_id}/{YYYY-MM-DD-HHmm}.pdf`

Rotation: after storing a new PDF, list files for the template and delete oldest if count > `keep_last_n`.

## Cron Runner

### Recommended: Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/newspaper/cron", "schedule": "*/15 * * * *" }
  ]
}
```

The cron route runs every 15 minutes and checks which schedules are due (using `cron_expression` + `last_run_at` + `timezone`). This avoids needing one cron entry per schedule.

### Cron route: `POST /api/newspaper/cron`

Auth: `Authorization: Bearer <NEWSPAPER_CRON_SECRET>` (env var).

Logic:
1. Load all enabled schedules
2. For each, check if it's due: parse `cron_expression`, compute next run after `last_run_at`, compare to `now()` in the schedule's timezone
3. For due schedules: call `runSchedule(schedule)`
4. Update `last_run_at`

Use `cron-parser` npm package to evaluate cron expressions:
```
pnpm add cron-parser
```

### `runSchedule(schedule)` helper

```
1. Load template config from DB
2. Pre-fetch dynamic data:
   - Weather: for each WeatherBlock in config, fetch Open-Meteo data + inject
   - Calendar: load google_calendar_events for instance (if Google Calendar connected)
               merge into config.calendar_entries
3. Call render(config) → Buffer
4. Upload to Supabase Storage
5. Update schedule.last_pdf_path + last_run_at
6. If delivery.kindle.enabled → send to Kindle (see ticket 051)
```

## Schedule Management UI

Add a "Schedules" section to the template editor (ticket 048), or a separate settings sub-page per template.

Fields:
- Enabled toggle
- Cron expression input + human-readable preview (e.g. "Every day at 06:00")
- Timezone selector (searchable select)
- Delivery: storage toggle + keep_last_n; Kindle toggle + email input
- Last run timestamp (read-only)
- "Run Now" button → calls `POST /api/newspaper/[templateId]/generate`

Use a small helper to display cron expressions in plain English (e.g. `cronstrue` package):
```
pnpm add cronstrue
```

## Server Actions

| Action | Description |
|--------|-------------|
| `createSchedule(slug, templateId, data)` | Insert schedule |
| `updateSchedule(slug, scheduleId, data)` | Update schedule config |
| `deleteSchedule(slug, scheduleId)` | Delete schedule |
| `triggerSchedule(slug, scheduleId)` | On-demand run (calls the same runSchedule logic) |

## Environment Variables

```
NEWSPAPER_CRON_SECRET=<random 32+ char string>
```

## Acceptance Criteria

- [ ] Schedule can be created, edited, deleted per template
- [ ] Cron route fires on Vercel schedule and evaluates which schedules are due
- [ ] PDF is generated and stored in Supabase Storage
- [ ] Old PDFs are rotated per `keep_last_n`
- [ ] "Run Now" triggers immediate generation
- [ ] `last_run_at` updated after each run
- [ ] Timezone-aware scheduling works correctly
- [ ] Human-readable cron preview shown in UI
