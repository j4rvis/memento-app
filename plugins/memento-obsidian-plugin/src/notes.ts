import { App } from "obsidian";

export interface NoteBookmarkData {
  url: string;
  title: string;
  content: string;
  excerpt: string;
}

/**
 * Extracts bookmark data from the currently active note.
 * Returns null if no note is active.
 */
export async function getNoteBookmarkData(app: App): Promise<NoteBookmarkData | null> {
  const file = app.workspace.getActiveFile();
  if (!file) return null;

  const content = await app.vault.read(file);
  const vaultName = app.vault.getName();

  const url =
    `obsidian://open?vault=${encodeURIComponent(vaultName)}` +
    `&file=${encodeURIComponent(file.path)}`;

  const title = resolveTitleFromContent(content) ?? file.basename;
  const excerpt = extractExcerpt(content);

  return { url, title, content, excerpt };
}

/** Extract frontmatter `title` field, or return null. */
function resolveTitleFromContent(content: string): string | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const titleMatch = fmMatch[1].match(/^title:\s*(.+)$/m);
  return titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** Return first non-empty, non-frontmatter paragraph, truncated to 300 chars. */
function extractExcerpt(content: string): string {
  // Strip frontmatter
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    // Skip headings, blank lines, and block markers
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("```")) continue;
    return trimmed.length > 300 ? trimmed.slice(0, 297) + "…" : trimmed;
  }
  return "";
}
