# 052 — HomeAssistant Integration Guide & API Docs

## Goal

Provide clear in-app documentation and a setup guide so users can integrate the Newspaper PDF API with HomeAssistant for automated printing (e.g. via a Bluetooth or network printer).

## Background

See `docs/story-newspaper.md` and ticket 050 (API). This ticket is documentation/UX work — no new backend code required.

## In-App Integration Guide

Add a collapsible "Integrations" help section to the API Keys settings page (ticket 050 UI). Show a step-by-step guide:

### Step 1 — Create an API key
Covered by the API Keys UI in ticket 050. Scope needed: `read:pdf`.

### Step 2 — Find your Template ID
Show the template ID on the template list page (or in the editor header). One-click copy button.

### Step 3 — HomeAssistant setup

```yaml
# configuration.yaml

rest_command:
  print_newspaper:
    url: "https://YOUR_APP_URL/api/newspaper/YOUR_TEMPLATE_ID/pdf?key=YOUR_API_KEY"
    method: GET

# Optional: download and save locally first
shell_command:
  download_newspaper: >
    curl -s "https://YOUR_APP_URL/api/newspaper/YOUR_TEMPLATE_ID/pdf?key=YOUR_API_KEY"
    -o /config/www/newspaper.pdf

automation:
  - alias: "Print morning newspaper"
    description: "Download and print the daily newspaper at 07:00"
    trigger:
      - platform: time
        at: "07:00:00"
    action:
      - service: shell_command.download_newspaper
      - delay: "00:00:03"
      - service: shell_command.print_newspaper  # your printer command

shell_command:
  print_newspaper: lp -d YOUR_PRINTER_NAME /config/www/newspaper.pdf
```

Note: `lp` is the CUPS print command. For Bluetooth printers, the HA host machine needs the printer set up as a CUPS destination. Brother label printers and many inkjet printers work this way.

### Step 4 — Test the endpoint

Add a "Test" button in the UI that shows a sample `curl` command:
```bash
curl -L "https://YOUR_APP_URL/api/newspaper/YOUR_TEMPLATE_ID/pdf?key=YOUR_API_KEY" \
  -o newspaper.pdf
```

## API Reference Page

Add a simple `/i/[slug]/newspaper/api-docs` page (or a dialog/sheet) showing:

### Endpoints

#### `GET /api/newspaper/:templateId/pdf`

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | query | API key (alternative to Authorization header) |
| `date` | query | ISO date `YYYY-MM-DD` — fetch specific date's PDF |
| `generate` | query | `true` — generate if no stored PDF exists |

**Headers:**
- `Authorization: Bearer <api_key>` (alternative to `?key=`)

**Response:** `application/pdf`

#### `POST /api/newspaper/:templateId/generate`

Triggers on-demand generation. Returns JSON with `url`, `path`, `generated_at`, `size_bytes`.

### Response codes

| Code | Meaning |
|------|---------|
| 200 | PDF returned or generation metadata |
| 401 | Missing or invalid authentication |
| 403 | Valid key but insufficient scope |
| 404 | No PDF found for the requested date |
| 500 | Generation error (check server logs) |

## Template ID visibility

In the template list and editor (ticket 048):
- Show the template UUID below the template name in small monospace text
- Add a copy-to-clipboard icon next to it
- Label it "Template ID (for API use)"

## Acceptance Criteria

- [ ] In-app guide shows HA `configuration.yaml` snippet with placeholder substitution
- [ ] Template ID is visible and copyable in the UI
- [ ] Sample `curl` command shown with actual values filled in
- [ ] API reference documents all endpoints, params, and response codes
- [ ] Guide notes CUPS/printer setup requirement for Bluetooth printing
