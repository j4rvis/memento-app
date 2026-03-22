## 1. Database

- [x] 1.1 Create migration file for `newspaper_api_keys` table (id, instance_id, user_id, name, key_hash, scopes, last_used_at, created_at)
- [x] 1.2 Add RLS: enable RLS on `newspaper_api_keys`
- [x] 1.3 Add RLS SELECT policy: `(select auth.uid()) = user_id AND is_instance_member(instance_id)`
- [x] 1.4 Add RLS INSERT policy: `(select auth.uid()) = user_id AND is_instance_member(instance_id)`
- [x] 1.5 Add RLS DELETE policy: `(select auth.uid()) = user_id`
- [x] 1.6 Apply migration via Supabase dashboard (run `supabase/migrations/20260321000000_newspaper_api_keys.sql`)

## 2. Auth Helper

- [x] 2.1 Create `src/modules/newspaper/lib/api-auth.ts` with `authenticateApiRequest(request, templateId, requiredScope)` signature
- [x] 2.2 Implement session cookie path: `createClient()` → `getUser()` → load template → return `{ userId, instanceId }`
- [x] 2.3 Implement API key extraction: check `Authorization: Bearer` header first, then `?key=` query param
- [x] 2.4 Implement SHA-256 hashing of extracted key via `crypto.subtle.digest`
- [x] 2.5 Implement key lookup via `createServiceRoleClient()`: find row by `key_hash`, return 401 if not found
- [x] 2.6 Implement scope check: return 403 if required scope not in `key.scopes`
- [x] 2.7 Implement instance/template cross-check: load template, return 403 if `template.instance_id !== key.instance_id`, 404 if template not found
- [x] 2.8 Implement fire-and-forget `last_used_at` update after successful key auth

## 3. API Routes

- [x] 3.1 Create `src/app/api/newspaper/[templateId]/pdf/route.ts` — GET handler
- [x] 3.2 Call `authenticateApiRequest` with `read:pdf`, return error responses on failure
- [x] 3.3 Load template config via service role client, call `render(config)`, return PDF buffer
- [x] 3.4 Set `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<title>-<date>.pdf"`
- [x] 3.5 Accept `?generate=true` and `?date=` params without error (no-op for now)
- [x] 3.6 Create `src/app/api/newspaper/[templateId]/generate/route.ts` — POST handler
- [x] 3.7 Call `authenticateApiRequest` with `write:generate`, render, return JSON `{ path: null, generated_at, size_bytes }`
- [x] 3.8 Create `src/app/api/newspaper/cron/route.ts` — POST stub, verify `NEWSPAPER_CRON_SECRET`, return 200

## 4. Server Actions

- [x] 4.1 Add `createApiKey(slug, { name, scopes })` to `src/app/(app)/i/[slug]/settings/actions.ts`
- [x] 4.2 Generate raw key: `mnp_` + `crypto.randomBytes(32).toString('hex')`
- [x] 4.3 Hash raw key with SHA-256, insert row, call `revalidatePath`, return raw key string
- [x] 4.4 Add `revokeApiKey(slug, keyId)` — delete row (RLS enforces ownership), call `revalidatePath`

## 5. Settings UI Components

- [x] 5.1 Create `src/modules/newspaper/components/api-keys-card.tsx` — server component, fetch keys (id, name, scopes, created_at, last_used_at), render list + create button
- [x] 5.2 Create `src/modules/newspaper/components/create-api-key-dialog.tsx` — name input, scope checkboxes (`read:pdf` default on, `write:generate` default off), calls `createApiKey`, passes raw key to reveal dialog on success
- [x] 5.3 Create `src/modules/newspaper/components/reveal-key-dialog.tsx` — displays raw key in monospace, copy-to-clipboard button, "will not be shown again" warning, note that `?key=` in URLs appears in logs
- [x] 5.4 Create `src/modules/newspaper/components/revoke-key-button.tsx` — confirm before calling `revokeApiKey`

## 6. Wire Into Settings Page

- [x] 6.1 Import `ApiKeysCard` in `src/app/(app)/i/[slug]/settings/page.tsx`
- [x] 6.2 Add `<ApiKeysCard slug={slug} />` below the Members card
