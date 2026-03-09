# 028 — Newspaper Scheduling

## Goal
Auto-generate a newspaper edition on a configurable schedule (daily, weekly, or specific days + time) and optionally email the PDF to a configured address after generation.

## Dependencies
- **Requires ticket 026** (PDF generation API)

## Background
The newspaper is currently only generated on demand. Scheduling allows a user to receive their morning paper automatically without opening the app, and optionally have it delivered by email or to a Kindle.

## Schema Changes

Add a `schedule` JSONB column to the `newspapers` table:

```sql
ALTER TABLE newspapers
  ADD COLUMN schedule JSONB NOT NULL DEFAULT '{}'::jsonb;
```

Schedule shape:
```ts
interface NewspaperSchedule {
  enabled: boolean
  cron: string           // standard cron expression, e.g. "0 7 * * 1-5"
  timezone: string       // IANA timezone, e.g. "Europe/London"
  email_to?: string      // optional delivery email
  kindle_email?: string  // optional Kindle delivery email
}
```

## Implementation Notes

### Settings UI

In the newspaper settings panel, add a "Schedule" section:
- Toggle: "Auto-generate on a schedule"
- When enabled, show:
  - Schedule presets dropdown: Daily (07:00), Weekdays (07:00), Weekly (Mon 08:00), Custom
  - Custom: cron expression input + timezone selector
  - Optional email fields: "Email PDF to" and "Kindle email"
- Save via a server action that updates `newspapers.schedule`

### Edge Function: `generate-scheduled-editions`

Create `supabase/functions/generate-scheduled-editions/index.ts`:
1. Query `newspapers` where `schedule->>'enabled' = 'true'`
2. For each newspaper, evaluate whether the current time matches the cron (use a cron parser library or pg_cron)
3. Call `generateEdition` logic (or reuse the existing action via internal fetch)
4. If `email_to` is set, render the edition to PDF and send via Resend (or SMTP)
5. Log results to `newspaper_editions` (already done by `generateEdition`)

### pg_cron Trigger

Register a pg_cron job that calls the Edge Function on a frequent interval (e.g. every minute) — the function itself handles per-newspaper schedule evaluation:

```sql
SELECT cron.schedule(
  'check-newspaper-schedules',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/generate-scheduled-editions',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  )$$
);
```

### Email Delivery

Use Resend (`resend` npm package) or Nodemailer with SMTP:
- Subject: `[Newspaper Name] — [Date]`
- Body: brief text noting the edition
- Attachment: PDF bytes from the print API
- Add `RESEND_API_KEY` to required env vars (documented in CLAUDE.md)

## New Files
```
supabase/functions/generate-scheduled-editions/index.ts
supabase/migrations/YYYYMMDD_newspaper_schedule.sql
```

## Files to Update
- Newspaper settings UI component — add Schedule section
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add `updateSchedule` action
- `CLAUDE.md` / env docs — add `RESEND_API_KEY`

## Acceptance Criteria
- [ ] `schedule` JSONB column added to `newspapers` via migration
- [ ] Schedule settings UI with preset options and custom cron input
- [ ] Toggle enables/disables scheduling without losing other settings
- [ ] Edge Function queries enabled newspapers and generates editions on schedule
- [ ] pg_cron job registered to invoke the Edge Function every minute
- [ ] Email delivery sends PDF attachment when `email_to` is configured
- [ ] Invalid cron expressions are rejected with a clear error message
