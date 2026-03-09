# 026 — Newspaper API & Home Assistant Print Trigger

## Goal
Expose a public API endpoint that generates a newspaper edition and returns a print-ready PDF, so Home Assistant (or any HTTP client) can trigger a print job on a Bluetooth-connected printer without any browser interaction.

## API Endpoint

### `GET /api/newspaper/[newspaperId]/print?token=<api_token>`

1. Validates the `api_token` against a per-newspaper API token stored in the `newspapers` table
2. Runs `generateEdition` for the newspaper (creates a new edition snapshot)
3. Renders the edition preview HTML server-side
4. Converts to PDF (see PDF generation below) and returns it as `application/pdf`

Alternatively accept `?edition=<editionId>` to return an existing edition as PDF without regenerating.

### Token Management
Add an `api_token` column (text, nullable, unique) to `newspapers`. In the newspaper settings UI, show the token with a "Regenerate" button. Token is a random 32-byte hex string generated server-side.

## PDF Generation

Use [`puppeteer`](https://pptr.dev/) (headless Chromium) or [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) (lighter, works on serverless) to render the existing preview page HTML to PDF:
- Paper size matching the newspaper's configured format (A4 or A5)
- Print media query applied (`@media print`)
- No headers/footers from browser chrome

Alternative: use [`react-pdf`](https://react-pdf.org/) to render the edition directly to PDF without a headless browser — more portable but requires a separate PDF layout.

**Recommended:** Start with Puppeteer (`puppeteer-core` + `@sparticuz/chromium`) as it reuses the existing HTML/CSS preview with zero duplication.

## Home Assistant Integration

In Home Assistant, add a `rest_command` to `configuration.yaml`:

```yaml
rest_command:
  print_morning_newspaper:
    url: "https://your-domain.com/api/newspaper/<id>/print?token=<token>"
    method: GET
```

Then trigger from an automation (e.g. weekday at 07:00):
```yaml
automation:
  - alias: "Print morning newspaper"
    trigger:
      platform: time
      at: "07:00:00"
    action:
      service: rest_command.print_morning_newspaper
```

The PDF response would need to be forwarded to the printer. Options:
- Home Assistant [`print` integration](https://www.home-assistant.io/integrations/print/) (if available for the printer)
- A small companion script on the Home Assistant host: `curl ... | lp -d <printer-name>`
- Node-RED flow that receives the PDF bytes and sends to printer

Include setup instructions for each option in the ticket implementation notes.

## Additional API Endpoints (optional, same auth pattern)

| Endpoint | Description |
|----------|-------------|
| `GET /api/newspaper/[id]/editions` | List editions as JSON |
| `GET /api/newspaper/[id]/editions/[editionId]/print` | PDF of specific edition |

## Security
- Tokens are not user-session-based — they're long-lived bearer tokens (like webhooks)
- Endpoint is unauthenticated but token-gated (no Supabase session required)
- Rate-limit to prevent abuse (e.g. 10 requests/hour per token)
- Token is never exposed in URLs logged by Next.js (pass as header option for non-HA clients)

## Acceptance Criteria
- [ ] `api_token` can be generated and regenerated from the settings UI
- [ ] `GET /api/newspaper/[id]/print?token=...` returns a valid PDF
- [ ] PDF matches the A4/A5 format configured on the newspaper
- [ ] Existing edition can be fetched as PDF without regenerating
- [ ] Invalid/missing token returns 401
- [ ] Home Assistant `rest_command` example is documented
- [ ] Print-to-Bluetooth-printer workflow is documented with at least one working method
