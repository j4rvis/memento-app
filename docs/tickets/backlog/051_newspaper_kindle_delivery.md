# 051 — Newspaper Kindle Delivery

## Goal

When a schedule runs, optionally email the generated PDF to the user's Kindle address so it appears as a document on the device.

## Background

See `docs/story-newspaper.md`. Depends on ticket 049 (scheduler produces the PDF buffer). Kindle delivery is wired into `runSchedule()` from ticket 049.

## How Kindle document delivery works

Amazon allows sending documents to a Kindle via email attachment to `<username>@kindle.com`. Requirements:
1. The sender's email address must be in the user's **approved personal document sources** list (managed at amazon.com → Account → Manage Your Content and Devices → Preferences → Personal Document Settings).
2. Supported formats: PDF (delivered as-is), MOBI, DOC, HTML. PDF works directly.
3. Subject line becomes the document title on the device.

## Email provider

Use **Resend** (simple API, good DX, generous free tier):
```
pnpm add resend
```

Env var:
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=newspaper@your-domain.com  # must be a verified Resend domain
```

Alternatively support SendGrid (`SENDGRID_API_KEY`) as a fallback — abstract behind a `sendEmail()` helper so the provider is swappable.

## Implementation

### Email helper: `src/modules/newspaper/lib/email.ts`

```typescript
interface SendPdfEmailOptions {
  to: string;         // kindle email
  subject: string;    // document title on Kindle
  pdfBuffer: Buffer;
  filename: string;   // e.g. 'morning-brief-2026-03-20.pdf'
}

async function sendPdfEmail(options: SendPdfEmailOptions): Promise<void>
```

Uses Resend's `attachments` field. Keep the body minimal — Kindle ignores email body for PDFs.

### Integration point in `runSchedule()`

After PDF is generated and stored:
```typescript
if (delivery.kindle?.enabled && delivery.kindle.email) {
  await sendPdfEmail({
    to: delivery.kindle.email,
    subject: `${template.name} – ${formatDate(new Date(), 'MMMM d, yyyy')}`,
    pdfBuffer,
    filename: `${slugify(template.name)}-${date}.pdf`,
  });
}
```

## Delivery Config UI

In the schedule editor (ticket 049):
- Kindle toggle: enable/disable
- Kindle email input: `foo@kindle.com`
- Informational note: "Your sender address (`newspaper@your-domain.com`) must be added to your approved Kindle document sources at amazon.com"
- Link to Amazon's approved senders settings page

## Error Handling

- Resend API errors should **not** fail the schedule run — log the error and update a `last_delivery_error` field on the schedule (add column if needed).
- Retry logic: not needed for initial implementation — Kindle delivery is best-effort.

## Acceptance Criteria

- [ ] `sendPdfEmail()` sends a PDF attachment to a Kindle address via Resend
- [ ] Delivery is triggered after successful PDF generation in `runSchedule()`
- [ ] Delivery failure does not abort the schedule run (error logged, not thrown)
- [ ] Kindle email field + toggle visible in schedule editor UI
- [ ] Informational note about approved senders shown in UI
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars documented
