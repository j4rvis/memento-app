var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ScryfallPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  targetFolder: "Cards",
  imagesFolder: "Cards/images",
  languagePreference: "en",
  saveImagesLocally: false,
  insertImageInline: false
};
var ScryfallSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h3", { text: "How to use" });
    const howTo = containerEl.createEl("div", { cls: "scryfall-howto" });
    howTo.createEl("p", {
      text: 'Open the command palette (Cmd/Ctrl + P) and run "Scryfall: Insert card". Type a card name to search \u2014 results appear as you type. Selecting a card:'
    });
    const list = howTo.createEl("ol");
    list.createEl("li", { text: "Creates (or updates) a note in the card notes folder with full card data as frontmatter." });
    list.createEl("li", { text: "Inserts a [[wikilink]] to that note at your cursor position." });
    howTo.createEl("p", {
      text: 'You can also assign a custom hotkey under Settings \u2192 Hotkeys \u2192 search "Scryfall".'
    });
    containerEl.createEl("h3", { text: "Settings" });
    new import_obsidian.Setting(containerEl).setName("Card notes folder").setDesc("Vault folder where card notes are saved.").addText(
      (text) => text.setPlaceholder("Cards").setValue(this.plugin.settings.targetFolder).onChange(async (value) => {
        this.plugin.settings.targetFolder = value || "Cards";
        await this.plugin.saveData(this.plugin.settings);
      })
    );
    new import_obsidian.Setting(containerEl).setName("Language preference").setDesc("Which language to search first. The other is used as fallback.").addDropdown(
      (drop) => drop.addOption("en", "English").addOption("de", "German").setValue(this.plugin.settings.languagePreference).onChange(async (value) => {
        this.plugin.settings.languagePreference = value;
        await this.plugin.saveData(this.plugin.settings);
      })
    );
    new import_obsidian.Setting(containerEl).setName("Save images locally").setDesc(
      "Download card images into the vault (~100 KB per card). When off, only the Scryfall CDN URL is stored."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.saveImagesLocally).onChange(async (value) => {
        this.plugin.settings.saveImagesLocally = value;
        await this.plugin.saveData(this.plugin.settings);
        this.display();
      })
    );
    if (this.plugin.settings.saveImagesLocally) {
      new import_obsidian.Setting(containerEl).setName("Images folder").setDesc("Vault folder where card images are downloaded.").addText(
        (text) => text.setPlaceholder("Cards/images").setValue(this.plugin.settings.imagesFolder).onChange(async (value) => {
          this.plugin.settings.imagesFolder = value || "Cards/images";
          await this.plugin.saveData(this.plugin.settings);
        })
      );
    }
    new import_obsidian.Setting(containerEl).setName("Insert image inline").setDesc("Also insert an image embed below the wikilink when inserting a card.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.insertImageInline).onChange(async (value) => {
        this.plugin.settings.insertImageInline = value;
        await this.plugin.saveData(this.plugin.settings);
      })
    );
  }
};

// src/modal.ts
var import_obsidian3 = require("obsidian");

// src/scryfall.ts
var SCRYFALL_HEADERS = {
  "Accept": "application/json",
  "User-Agent": "scryfall-obsidian-plugin/1.0"
};
var BASE_URL = "https://api.scryfall.com";
async function searchCards(query) {
  var _a;
  const url = `${BASE_URL}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`;
  console.log("[Scryfall] fetching:", url);
  try {
    const res = await fetch(url, { headers: SCRYFALL_HEADERS });
    console.log("[Scryfall] response status:", res.status);
    if (!res.ok) {
      console.warn("[Scryfall] non-ok response:", res.status, res.statusText);
      return [];
    }
    const body = await res.json();
    return (_a = body.data) != null ? _a : [];
  } catch (e) {
    console.warn("[Scryfall] searchCards error:", e);
    return [];
  }
}
async function searchByName(term, primaryLang) {
  const [primaryQuery, fallbackQuery] = primaryLang === "en" ? [`name:${term}`, `name:${term} lang:de`] : [`name:${term} lang:de`, `name:${term}`];
  const primaryResults = await searchCards(primaryQuery);
  const fallbackResults = primaryResults.length === 0 ? await searchCards(fallbackQuery) : [];
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  for (const card of [...primaryResults, ...fallbackResults]) {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      merged.push(card);
    }
  }
  return merged;
}
function getCardImageUrl(card) {
  var _a, _b, _c, _d, _e;
  return (_e = (_a = card.image_uris) == null ? void 0 : _a.normal) != null ? _e : (_d = (_c = (_b = card.card_faces) == null ? void 0 : _b[0]) == null ? void 0 : _c.image_uris) == null ? void 0 : _d.normal;
}
async function downloadImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (e) {
    return null;
  }
}

// src/note-writer.ts
var import_obsidian2 = require("obsidian");
function serializeFrontmatter(fields) {
  const lines = ["---"];
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
function escapeYaml(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}
async function ensureFolder(app, folderPath) {
  const normalized = (0, import_obsidian2.normalizePath)(folderPath);
  if (!app.vault.getAbstractFileByPath(normalized)) {
    await app.vault.createFolder(normalized);
  }
}
async function findExistingNote(app, targetFolder, scryfallId) {
  var _a;
  const normalized = (0, import_obsidian2.normalizePath)(targetFolder);
  const folder = app.vault.getAbstractFileByPath(normalized);
  if (!folder) return null;
  const files = app.vault.getFiles().filter((f) => f.path.startsWith(normalized + "/") && f.extension === "md");
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    if (((_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a.scryfall_id) === scryfallId) {
      return file;
    }
  }
  return null;
}
function replaceFrontmatter(existingContent, newFrontmatter) {
  const fmMatch = existingContent.match(/^---\n[\s\S]*?\n---\n?/);
  if (fmMatch) {
    return newFrontmatter + "\n" + existingContent.slice(fmMatch[0].length);
  }
  return newFrontmatter + "\n" + existingContent;
}
async function resolveNotePath(app, targetFolder, card, existingFile) {
  if (existingFile) return existingFile.path;
  const baseName = sanitizeFilename(card.name);
  const candidate = (0, import_obsidian2.normalizePath)(`${targetFolder}/${baseName}.md`);
  const existing = app.vault.getAbstractFileByPath(candidate);
  if (!existing) return candidate;
  return (0, import_obsidian2.normalizePath)(`${targetFolder}/${baseName} (${card.set.toUpperCase()}).md`);
}
async function upsertCardNote(app, card, settings, foundViaGerman) {
  await ensureFolder(app, settings.targetFolder);
  const existingFile = await findExistingNote(app, settings.targetFolder, card.id);
  const notePath = await resolveNotePath(app, settings.targetFolder, card, existingFile);
  const imageUrl = getCardImageUrl(card);
  let imageLocal;
  if (settings.saveImagesLocally && imageUrl) {
    await ensureFolder(app, settings.imagesFolder);
    const imagePath = (0, import_obsidian2.normalizePath)(`${settings.imagesFolder}/${card.id}.png`);
    const existing = app.vault.getAbstractFileByPath(imagePath);
    if (!existing) {
      const buffer = await downloadImage(imageUrl);
      if (buffer) {
        await app.vault.createBinary(imagePath, buffer);
      }
    }
    imageLocal = imagePath;
  }
  const fields = {
    scryfall_id: card.id,
    name: card.name,
    name_de: foundViaGerman && card.printed_name ? card.printed_name : void 0,
    mana_cost: card.mana_cost,
    type_line: card.type_line,
    oracle_text: card.oracle_text,
    set: card.set,
    set_name: card.set_name,
    rarity: card.rarity,
    legalities: card.legalities,
    image_url: imageUrl,
    image_local: imageLocal
  };
  const frontmatter = serializeFrontmatter(fields);
  if (existingFile) {
    const content = await app.vault.read(existingFile);
    await app.vault.modify(existingFile, replaceFrontmatter(content, frontmatter));
    return { file: existingFile, notePath: existingFile.path };
  } else {
    const file = await app.vault.create(notePath, frontmatter + "\n");
    return { file, notePath };
  }
}

// src/modal.ts
var ScryfallSearchModal = class extends import_obsidian3.SuggestModal {
  constructor(app, plugin, editor) {
    super(app);
    this.debounceTimer = null;
    this.pendingResolve = null;
    this.foundViaGerman = false;
    this.plugin = plugin;
    this.editor = editor;
    this.setPlaceholder("Search for a Magic card\u2026");
    console.log("[Scryfall] modal constructed");
  }
  async getSuggestions(query) {
    console.log("[Scryfall] getSuggestions called, query:", query);
    if (this.pendingResolve) {
      this.pendingResolve([]);
      this.pendingResolve = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (!query.trim()) return [];
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.debounceTimer = setTimeout(async () => {
        this.pendingResolve = null;
        this.debounceTimer = null;
        this.updateLoadingIndicator(true);
        console.log("[Scryfall] debounce fired, fetching:", query);
        try {
          const results = await searchByName(
            query,
            this.plugin.settings.languagePreference
          );
          console.log("[Scryfall] search results:", results.length);
          this.foundViaGerman = results.length > 0 && results[0].lang !== "en";
          resolve(results.slice(0, 10));
        } catch (e) {
          console.error("[Scryfall] search error:", e);
          resolve([]);
        } finally {
          this.updateLoadingIndicator(false);
        }
      }, 300);
    });
  }
  renderSuggestion(card, el) {
    el.createEl("span", {
      cls: "scryfall-card-name",
      text: card.name
    });
    const meta = el.createEl("small", { cls: "scryfall-card-meta" });
    if (card.mana_cost) meta.appendText(` ${card.mana_cost}`);
    meta.appendText(` \xB7 ${card.set_name}`);
    if (card.lang !== "en") meta.appendText(` \xB7 ${card.lang.toUpperCase()}`);
  }
  async onChooseSuggestion(card) {
    console.log("[Scryfall] card chosen:", card.name);
    const { notePath } = await upsertCardNote(
      this.app,
      card,
      this.plugin.settings,
      this.foundViaGerman
    );
    const noteName = notePath.replace(/^.*\//, "").replace(/\.md$/, "");
    let insertText = `[[${noteName}]]`;
    if (this.plugin.settings.insertImageInline) {
      if (this.plugin.settings.saveImagesLocally) {
        const imgName = `${card.id}.png`;
        insertText += `
![[${imgName}]]`;
      } else {
        const url = getCardImageUrl(card);
        if (url) insertText += `
![${card.name}](${url})`;
      }
    }
    if (this.editor) {
      this.editor.replaceSelection(insertText);
    } else {
      new import_obsidian3.Notice(`Card note created: ${noteName}`);
    }
  }
  updateLoadingIndicator(loading) {
    if (loading) {
      this.inputEl.addClass("scryfall-loading");
    } else {
      this.inputEl.removeClass("scryfall-loading");
    }
  }
};

// src/main.ts
var ScryfallPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    console.log("[Scryfall] onload");
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    console.log("[Scryfall] settings loaded", this.settings);
    this.addSettingTab(new ScryfallSettingTab(this.app, this));
    this.addCommand({
      id: "insert-card",
      name: "Insert card",
      callback: () => {
        var _a, _b;
        console.log("[Scryfall] command fired, opening modal");
        const editor = (_b = (_a = this.app.workspace.activeEditor) == null ? void 0 : _a.editor) != null ? _b : null;
        new ScryfallSearchModal(this.app, this, editor).open();
      }
    });
    console.log("[Scryfall] plugin ready");
  }
  async onunload() {
  }
};
