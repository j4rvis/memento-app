import { App, TFile, normalizePath } from "obsidian";
import { ScryfallCard, downloadImage, getCardImageUrl } from "./scryfall";
import { ScryfallSettings } from "./settings";

interface NoteFields {
  scryfall_id: string;
  name: string;
  name_de?: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  set: string;
  set_name: string;
  rarity: string;
  legalities: Record<string, string>;
  image_url?: string;
  image_local?: string;
}

function serializeFrontmatter(fields: NoteFields): string {
  const lines: string[] = ["---"];
  lines.push(`scryfall_id: "${fields.scryfall_id}"`);
  lines.push(`name: "${escapeYaml(fields.name)}"`);
  if (fields.name_de) lines.push(`name_de: "${escapeYaml(fields.name_de)}"`);
  if (fields.mana_cost) lines.push(`mana_cost: "${escapeYaml(fields.mana_cost)}"`);
  lines.push(`type_line: "${escapeYaml(fields.type_line)}"`);
  if (fields.oracle_text)
    lines.push(`oracle_text: "${escapeYaml(fields.oracle_text)}"`);
  lines.push(`set: "${fields.set}"`);
  lines.push(`set_name: "${escapeYaml(fields.set_name)}"`);
  lines.push(`rarity: "${fields.rarity}"`);
  if (fields.image_url) lines.push(`image_url: "${fields.image_url}"`);
  if (fields.image_local) lines.push(`image_local: "${fields.image_local}"`);
  lines.push("legalities:");
  for (const [format, status] of Object.entries(fields.legalities)) {
    lines.push(`  ${format}: "${status}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function escapeYaml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (!app.vault.getAbstractFileByPath(normalized)) {
    await app.vault.createFolder(normalized);
  }
}

/**
 * Scans the target folder for a note whose frontmatter contains the given scryfall_id.
 */
async function findExistingNote(
  app: App,
  targetFolder: string,
  scryfallId: string
): Promise<TFile | null> {
  const normalized = normalizePath(targetFolder);
  const folder = app.vault.getAbstractFileByPath(normalized);
  if (!folder) return null;

  const files = app.vault
    .getFiles()
    .filter((f) => f.path.startsWith(normalized + "/") && f.extension === "md");

  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    if (cache?.frontmatter?.scryfall_id === scryfallId) {
      return file;
    }
  }
  return null;
}

/**
 * Resolves the file path for a card note, handling filename collisions.
 */
async function resolveNotePath(
  app: App,
  targetFolder: string,
  card: ScryfallCard,
  existingFile: TFile | null
): Promise<string> {
  if (existingFile) return existingFile.path;

  const baseName = sanitizeFilename(card.name);
  const candidate = normalizePath(`${targetFolder}/${baseName}.md`);
  const existing = app.vault.getAbstractFileByPath(candidate);

  if (!existing) return candidate;

  // Collision: different card has same name — append set code
  return normalizePath(`${targetFolder}/${baseName} (${card.set.toUpperCase()}).md`);
}

const IMAGE_LINE_RE = /^!\[.*?\]\(.*?\)|^!\[\[.*?\]\]/;

/**
 * Returns the image embed line for the note body, or null if excluded/no image.
 */
function buildImageLine(card: ScryfallCard, settings: ScryfallSettings): string | null {
  if (settings.excludedSets.includes(card.set)) return null;

  if (settings.saveImagesLocally) {
    const imagePath = normalizePath(`${settings.imagesFolder}/${card.id}.png`);
    return `![[${imagePath}]]`;
  }

  const url = getCardImageUrl(card);
  if (!url) return null;
  return `![${card.name}](${url})`;
}

/**
 * Given existing note body text (without frontmatter), replaces or prepends the image line.
 */
function applyImageLine(body: string, imageLine: string | null): string {
  const lines = body.split("\n");

  let firstContentIdx = 0;
  while (firstContentIdx < lines.length && lines[firstContentIdx].trim() === "") {
    firstContentIdx++;
  }

  const firstLine = lines[firstContentIdx] ?? "";
  const hasImageLine = IMAGE_LINE_RE.test(firstLine);

  if (imageLine === null) {
    if (hasImageLine) lines.splice(firstContentIdx, 1);
    return lines.join("\n");
  }

  if (hasImageLine) {
    lines[firstContentIdx] = imageLine;
  } else {
    lines.splice(firstContentIdx, 0, imageLine, "");
  }
  return lines.join("\n");
}

export async function upsertCardNote(
  app: App,
  card: ScryfallCard,
  settings: ScryfallSettings,
  foundViaGerman: boolean
): Promise<{ file: TFile; notePath: string }> {
  await ensureFolder(app, settings.targetFolder);

  const existingFile = await findExistingNote(app, settings.targetFolder, card.id);
  const notePath = await resolveNotePath(app, settings.targetFolder, card, existingFile);

  const imageUrl = getCardImageUrl(card);
  let imageLocal: string | undefined;

  if (settings.saveImagesLocally && imageUrl) {
    await ensureFolder(app, settings.imagesFolder);
    const imagePath = normalizePath(`${settings.imagesFolder}/${card.id}.png`);
    const existing = app.vault.getAbstractFileByPath(imagePath);
    if (!existing) {
      const buffer = await downloadImage(imageUrl);
      if (buffer) {
        await app.vault.createBinary(imagePath, buffer);
      }
    }
    imageLocal = imagePath;
  }

  const fields: NoteFields = {
    scryfall_id: card.id,
    name: card.name,
    name_de: foundViaGerman && card.printed_name ? card.printed_name : undefined,
    mana_cost: card.mana_cost,
    type_line: card.type_line,
    oracle_text: card.oracle_text,
    set: card.set,
    set_name: card.set_name,
    rarity: card.rarity,
    legalities: card.legalities,
    image_url: imageUrl,
    image_local: imageLocal,
  };

  const frontmatter = serializeFrontmatter(fields);
  const imageLine = buildImageLine(card, settings);

  if (existingFile) {
    const content = await app.vault.read(existingFile);
    const fmMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
    const existingBody = fmMatch ? content.slice(fmMatch[0].length) : content;
    const newBody = applyImageLine(existingBody, imageLine);
    await app.vault.modify(existingFile, frontmatter + "\n" + newBody);
    return { file: existingFile, notePath: existingFile.path };
  } else {
    const body = imageLine ? imageLine + "\n" : "";
    const file = await app.vault.create(notePath, frontmatter + "\n" + body);
    return { file, notePath };
  }
}
