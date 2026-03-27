# 056 — Home Assistant v1 API Integration

## Goal

Document and test a Home Assistant integration that uses the new `/api/v1/` endpoints (ticket 054) to trigger newspaper generation, create todos, and save bookmarks — beyond the newspaper-only integration in ticket 052.

## Background

Ticket 052 covers the HA integration for the old newspaper API (`/api/newspaper/[id]/pdf?key=`). This ticket covers the new JWT-based API for broader automation use cases.

Depends on ticket 054 (API-first refactor). The new auth flow requires `POST /api/auth/token` first, then Bearer header on each call — different from the simple `?key=` param in ticket 052.

## Home Assistant Integration Patterns

### Pattern 1 — Newspaper generation (using new JWT API)

```yaml
# configuration.yaml

rest_command:
  memento_token:
    url: "https://YOUR_APP/api/auth/token"
    method: POST
    content_type: "application/json"
    payload: '{"client_id": "{{ client_id }}", "client_secret": "{{ client_secret }}"}'

  generate_newspaper:
    url: "https://YOUR_APP/api/v1/newspaper/generate"
    method: POST
    content_type: "application/json"
    headers:
      Authorization: "Bearer {{ token }}"
    payload: '{"template_id": "YOUR_TEMPLATE_ID"}'
```

Because HA's `rest_command` doesn't natively chain requests (get token, then use it), the recommended approach is to store the JWT in an `input_text` helper and refresh it with a script on a schedule.

### Pattern 2 — Create a todo from HA automation

Example: when a package arrives (trigger from delivery notification), create a "Pick up package" todo.

```yaml
automation:
  - alias: "Package delivered → create todo"
    trigger:
      - platform: state
        entity_id: sensor.mailbox_motion
        to: "on"
    action:
      - service: rest_command.create_memento_todo
        data:
          title: "Pick up package"
          priority: 2
```

### Pattern 3 — Save a bookmark from HA

Example: save a news article URL found in a notification.

```yaml
automation:
  - alias: "Save article from notification"
    trigger:
      - platform: event
        event_type: mobile_app_notification_action
        event_data:
          action: SAVE_ARTICLE
    action:
      - service: rest_command.create_memento_bookmark
        data:
          url: "{{ trigger.event.data.reply_text }}"
```

## JWT Token Management in HA

The main challenge: JWTs expire in 24h. Recommended solution:

1. Store `client_id` and `client_secret` as HA secrets in `secrets.yaml`
2. Store the current JWT in an `input_text.memento_token` helper
3. Create an automation that refreshes the token daily (00:01 each day)
4. All Memento `rest_command`s reference `states('input_text.memento_token')` as the Bearer value

Provide a ready-to-use HA package file (`memento.yaml`) that users can drop into their HA config.

## In-App Changes

### Settings page addition (within ticket 054's `/settings/api` page)

Add a collapsible "Home Assistant Integration" section showing:

1. **Token script** — copy-pasteable HA automation YAML for token refresh
2. **rest_command snippets** — for newspaper, todos, bookmarks
3. **Full package download** — a `memento_ha_package.yaml` file download with all helpers, scripts, and automations pre-filled with the user's API URL and client credentials (client_id only, not secret)

### API endpoint needed: `GET /api/v1/me` (small addition to ticket 054)

Returns basic info for connection testing:
```json
{ "data": { "user_id": "uuid", "instance_id": "uuid", "scopes": [...] } }
```
This lets HA (and the Obsidian plugin) do a lightweight "test connection" call.

## Postman / curl reference

Provide a curl sequence in the docs:

```bash
# Step 1: Get JWT
TOKEN=$(curl -s -X POST https://YOUR_APP/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"mc_...","client_secret":"..."}' \
  | jq -r '.access_token')

# Step 2: Use the API
curl -H "Authorization: Bearer $TOKEN" https://YOUR_APP/api/v1/todos
```

## Dependencies

- Ticket 054 (API-first refactor) — all `/api/v1/` endpoints must exist
- Optional: `GET /api/v1/me` endpoint (can be added in ticket 054 or here)
- Ticket 052 remains valid for the old newspaper `?key=` flow

## Acceptance Criteria

- [ ] `memento_ha_package.yaml` template produced and tested in HA
- [ ] Token refresh automation documented and working
- [ ] Newspaper generation via HA working end-to-end with new JWT auth
- [ ] Todo creation from HA automation working
- [ ] In-app HA integration section added to `/settings/api`
- [ ] curl sequence documented in `docs/openapi.yaml` or separate guide
