## 1. Plugin Scaffold

- [x] 1.1 Create `obsidian-memento-plugin/` directory with `package.json`, `tsconfig.json`, `esbuild.config.mjs`, and `manifest.json`
- [x] 1.2 Install dependencies: `obsidian` (types), `esbuild`, `typescript`
- [x] 1.3 Create `src/main.ts` with a minimal `Plugin` class that loads/saves settings

## 2. Settings

- [x] 2.1 Define `MementoSettings` interface with `apiUrl`, `clientId`, `clientSecret`, `templateId` fields
- [x] 2.2 Implement `MementoSettingTab` class with input fields for all settings
- [x] 2.3 Wire settings tab into the plugin and verify persistence via `loadData()` / `saveData()`

## 3. API Client

- [x] 3.1 Create `src/api.ts` with `MementoApiClient` class that holds base URL and cached JWT
- [x] 3.2 Implement `authenticate()` method — calls `POST /api/auth/token`, caches the JWT in memory
- [x] 3.3 Implement `request(method, path, body?)` helper — attaches Bearer token, handles 401 by re-authenticating once and retrying
- [x] 3.4 Implement `createBookmark(url, title?)`, `createTodo(title, dueDate?)`, and `generateNewspaper(templateId)` methods
- [x] 3.5 Add error handling: network errors and non-2xx responses throw typed errors that callers convert to Notice messages

## 4. Commands

- [x] 4.1 Implement "Memento: Save bookmark" command — opens a modal pre-filled with clipboard URL, validates non-empty URL, calls `createBookmark()`
- [x] 4.2 Implement "Memento: Create todo" command — opens a modal with title (required) and due date (optional), calls `createTodo()`
- [x] 4.3 Implement "Memento: Generate newspaper" command — reads `templateId` from settings, calls `generateNewspaper()`, shows notice on success or missing config
- [x] 4.4 Register all three commands in `onload()` and verify they appear in the Obsidian command palette

## 5. Error Notices

- [x] 5.1 Add a `showNotice(message)` utility and wire all API error paths to surface notices per spec
- [x] 5.2 Verify authentication failure notice, duplicate bookmark notice, and network error notice all display correctly

## 6. CORS Check

- [x] 6.1 Verify that the Memento Next.js API routes return `Access-Control-Allow-Origin: *` (or appropriate origin) for `/api/auth/token` and `/api/v1/*`
- [x] 6.2 If CORS headers are missing, add them via a Next.js `middleware.ts` or per-route response headers for all `/api/` routes

## 7. Build & Distribution

- [x] 7.1 Confirm `esbuild` bundles to `main.js` correctly with `target: 'es2018'` and `platform: 'node'`
- [x] 7.2 Add `README.md` to the plugin directory with install and configuration instructions
- [x] 7.3 Manually test all three commands against a running Memento instance

## 8. Note-as-bookmark

- [x] 8.1 Add a `getNoteBookmarkData(app)` helper in `src/notes.ts` that extracts `url` (Obsidian deep link), `title` (frontmatter → filename), `content` (full markdown), and `excerpt` (first non-frontmatter paragraph ≤300 chars) from the active note
- [x] 8.2 Update `BookmarkModal` to accept an optional `noteData` parameter; render a mode toggle (URL / Note) when both modes are available; show note title + excerpt preview in note mode
- [x] 8.3 Update `saveBookmarkCommand` in `main.ts` to read the active note via `app.workspace.getActiveFile()`, fetch its content via `app.vault.read(file)`, call `getNoteBookmarkData`, and pass the result to `BookmarkModal`
- [x] 8.4 Update `createBookmark` in `src/api.ts` to accept an optional full-body payload (title, content, excerpt) and pass it through when provided
- [x] 8.5 Rebuild (`npm run build`) and verify the bundle still compiles cleanly
