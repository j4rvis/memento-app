- articles fetched from a website should be saved in the md format
- no html to be rendered to allow my color styles and theme
- but ofc display the markdown accordingly.
- avoid too many new lines and remove unnecessary whitespace.
- ensure proper formatting and readability.
- you can reference images by url and not save them locally

## Plan

1. **Install `turndown`** — server-side HTML→Markdown conversion library.

2. **Update `scraper.ts`** — after extracting HTML content, convert to Markdown via turndown:
   - Configure turndown to keep images as `![alt](url)` (no local saving)
   - Strip excess blank lines (collapse 3+ newlines → 2)
   - Return `content` as Markdown string instead of HTML

3. **Update `article-content-panel.tsx`** — replace `dangerouslySetInnerHTML` with `<ReactMarkdown>` + `remark-gfm` (already installed).
   - Backwards compat: if content contains closing HTML tags (`</`), render via `dangerouslySetInnerHTML` (old articles)
   - Otherwise render via `ReactMarkdown`

4. **Update `article-reader.tsx`** — same rendering switch; update edit label from "Content (HTML)" to "Content (Markdown)".

## Summary

Switched article scraping to store Markdown instead of HTML. Installed `turndown` for server-side HTML→MD conversion with ATX headings, fenced code blocks, and bullet lists. Excess blank lines (3+) are collapsed to 2. Images are referenced by URL (no local storage). Both display components (`article-content-panel.tsx` and `article-reader.tsx`) now render Markdown via `react-markdown` + `remark-gfm`, while legacy HTML articles (those containing `</`) continue to render via `dangerouslySetInnerHTML` for backwards compatibility. Completed 2026-03-01.
