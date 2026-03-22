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
function getCardSmallImageUrl(card) {
  var _a, _b, _c, _d, _e;
  return (_e = (_a = card.image_uris) == null ? void 0 : _a.small) != null ? _e : (_d = (_c = (_b = card.card_faces) == null ? void 0 : _b[0]) == null ? void 0 : _c.image_uris) == null ? void 0 : _d.small;
}
async function fetchAllSets() {
  var _a;
  try {
    const res = await fetch(`${BASE_URL}/sets`, { headers: SCRYFALL_HEADERS });
    if (!res.ok) return [];
    const body = await res.json();
    return ((_a = body.data) != null ? _a : []).map((s) => {
      var _a2;
      return { code: s.code, name: s.name, set_type: (_a2 = s.set_type) != null ? _a2 : "" };
    });
  } catch (e) {
    return [];
  }
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

// src/settings.ts
var DEFAULT_SETTINGS = {
  targetFolder: "Cards",
  imagesFolder: "Cards/images",
  languagePreference: "en",
  saveImagesLocally: false,
  insertImageInline: false,
  excludedSets: []
};
var SET_TYPE_GROUPS = [
  { label: "Expansions & Core Sets", types: ["expansion", "core"] },
  { label: "Masters Sets", types: ["masters"] },
  { label: "Commander & Specialty", types: ["commander", "draft_innovation", "planechase", "archenemy", "vanguard"] },
  { label: "Promo & Extras", types: ["promo", "token", "memorabilia", "minigame"] }
];
function normalizeSetType(set_type) {
  for (const group of SET_TYPE_GROUPS) {
    if (group.types.includes(set_type)) return group.label;
  }
  return "Other";
}
var SetSuggest = class extends import_obsidian.AbstractInputSuggest {
  constructor(app, inputEl, getSets, onSelect) {
    super(app, inputEl);
    this.lastRenderedGroup = "";
    this.getSets = getSets;
    this.onSelect = onSelect;
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    const filtered = this.getSets().filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    filtered.sort((a, b) => {
      const ga = normalizeSetType(a.set_type);
      const gb = normalizeSetType(b.set_type);
      if (ga !== gb) return ga.localeCompare(gb);
      return a.name.localeCompare(b.name);
    });
    this.lastRenderedGroup = "";
    return filtered.slice(0, 30);
  }
  renderSuggestion(set, el) {
    const group = normalizeSetType(set.set_type);
    if (group !== this.lastRenderedGroup) {
      this.lastRenderedGroup = group;
      el.createDiv({ cls: "scryfall-set-group-separator", text: group });
    }
    const row = el.createDiv({ cls: "scryfall-set-row" });
    row.createSpan({ text: set.name });
    row.createSpan({ cls: "scryfall-set-code", text: ` (${set.code})` });
  }
  selectSuggestion(set) {
    this.onSelect(set);
    this.close();
  }
};
var ScryfallSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.allSets = [];
    this.plugin = plugin;
  }
  async display() {
    var _a, _b;
    const { containerEl } = this;
    containerEl.empty();
    if (this.allSets.length === 0) {
      fetchAllSets().then((sets) => {
        this.allSets = sets;
      });
    }
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
    containerEl.createEl("h3", { text: "Excluded sets" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Cards from excluded sets will not show artwork in the search dropdown or in card notes."
    });
    const excludedSets = this.plugin.settings.excludedSets;
    if (excludedSets.length > 0) {
      const exclusionList = containerEl.createEl("div", { cls: "scryfall-exclusion-list" });
      for (const code of excludedSets) {
        const row = exclusionList.createEl("div", { cls: "scryfall-exclusion-row" });
        const label = (_b = (_a = this.allSets.find((s) => s.code === code)) == null ? void 0 : _a.name) != null ? _b : code;
        row.createSpan({ text: `${label} (${code})` });
        const removeBtn = row.createEl("button", { text: "\xD7", cls: "scryfall-remove-btn" });
        removeBtn.addEventListener("click", async () => {
          this.plugin.settings.excludedSets = this.plugin.settings.excludedSets.filter((c) => c !== code);
          await this.plugin.saveData(this.plugin.settings);
          this.display();
        });
      }
    }
    const addSetting = new import_obsidian.Setting(containerEl).setName("Add excluded set").setDesc("Type a set name or code to search. ");
    addSetting.descEl.createEl("a", {
      text: "Browse all sets on Scryfall",
      href: "https://scryfall.com/sets"
    });
    addSetting.addText((text) => {
      const inputEl = text.inputEl;
      inputEl.addClass("scryfall-set-input");
      const suggest = new SetSuggest(this.app, inputEl, () => this.allSets, async (set) => {
        if (!this.plugin.settings.excludedSets.includes(set.code)) {
          this.plugin.settings.excludedSets.push(set.code);
          await this.plugin.saveData(this.plugin.settings);
        }
        inputEl.value = "";
        this.display();
      });
      text.setPlaceholder("e.g. Secret Lair Drop");
      inputEl._scryfallSuggest = suggest;
    });
  }
};

// src/modal.ts
var import_obsidian3 = require("obsidian");

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
async function resolveNotePath(app, targetFolder, card, existingFile) {
  if (existingFile) return existingFile.path;
  const baseName = sanitizeFilename(card.name);
  const candidate = (0, import_obsidian2.normalizePath)(`${targetFolder}/${baseName}.md`);
  const existing = app.vault.getAbstractFileByPath(candidate);
  if (!existing) return candidate;
  return (0, import_obsidian2.normalizePath)(`${targetFolder}/${baseName} (${card.set.toUpperCase()}).md`);
}
var IMAGE_LINE_RE = /^!\[.*?\]\(.*?\)|^!\[\[.*?\]\]/;
function buildImageLine(card, settings) {
  if (settings.excludedSets.includes(card.set)) return null;
  if (settings.saveImagesLocally) {
    const imagePath = (0, import_obsidian2.normalizePath)(`${settings.imagesFolder}/${card.id}.png`);
    return `![[${imagePath}]]`;
  }
  const url = getCardImageUrl(card);
  if (!url) return null;
  return `![${card.name}](${url})`;
}
function applyImageLine(body, imageLine) {
  var _a;
  const lines = body.split("\n");
  let firstContentIdx = 0;
  while (firstContentIdx < lines.length && lines[firstContentIdx].trim() === "") {
    firstContentIdx++;
  }
  const firstLine = (_a = lines[firstContentIdx]) != null ? _a : "";
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

// src/modal.ts
var SYMBOL_BASE = "https://svgs.scryfall.io/card-symbols/";
function renderManaCost(container, manaCost) {
  const tokens = [...manaCost.matchAll(/\{([^}]+)\}/g)];
  for (const match of tokens) {
    const code = match[1].replace(/\//g, "");
    const img = container.createEl("img", { cls: "scryfall-mana-symbol" });
    img.src = `${SYMBOL_BASE}${code}.svg`;
    img.width = 16;
    img.height = 16;
    img.alt = match[1];
  }
}
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
    el.addClass("scryfall-suggestion");
    const excluded = this.plugin.settings.excludedSets.includes(card.set);
    const smallUrl = excluded ? void 0 : getCardSmallImageUrl(card);
    if (smallUrl) {
      const img = el.createEl("img", { cls: "scryfall-thumb" });
      img.src = smallUrl;
      img.alt = card.name;
    }
    const info = el.createEl("div", { cls: "scryfall-card-info" });
    info.createEl("div", { cls: "scryfall-card-name", text: card.name });
    if (card.mana_cost) {
      const manaRow = info.createEl("div", { cls: "scryfall-card-mana" });
      renderManaCost(manaRow, card.mana_cost);
    }
    const setRow = info.createEl("div", { cls: "scryfall-card-set" });
    setRow.appendText(card.set_name);
    if (card.lang !== "en") setRow.appendText(` \xB7 ${card.lang.toUpperCase()}`);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy9zY3J5ZmFsbC50cyIsICJzcmMvbW9kYWwudHMiLCAic3JjL25vdGUtd3JpdGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIFNjcnlmYWxsU2V0dGluZ1RhYiwgU2NyeWZhbGxTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTY3J5ZmFsbFNlYXJjaE1vZGFsIH0gZnJvbSBcIi4vbW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NyeWZhbGxQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogU2NyeWZhbGxTZXR0aW5ncztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIG9ubG9hZFwiKTtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgICBjb25zb2xlLmxvZyhcIltTY3J5ZmFsbF0gc2V0dGluZ3MgbG9hZGVkXCIsIHRoaXMuc2V0dGluZ3MpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTY3J5ZmFsbFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbnNlcnQtY2FyZFwiLFxuICAgICAgbmFtZTogXCJJbnNlcnQgY2FyZFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIGNvbW1hbmQgZmlyZWQsIG9wZW5pbmcgbW9kYWxcIik7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3I/LmVkaXRvciA/PyBudWxsO1xuICAgICAgICBuZXcgU2NyeWZhbGxTZWFyY2hNb2RhbCh0aGlzLmFwcCwgdGhpcywgZWRpdG9yKS5vcGVuKCk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIHBsdWdpbiByZWFkeVwiKTtcbiAgfVxuXG4gIGFzeW5jIG9udW5sb2FkKCkge31cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEFic3RyYWN0SW5wdXRTdWdnZXN0LCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTY3J5ZmFsbFNldEluZm8sIGZldGNoQWxsU2V0cyB9IGZyb20gXCIuL3NjcnlmYWxsXCI7XG5pbXBvcnQgdHlwZSBTY3J5ZmFsbFBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NyeWZhbGxTZXR0aW5ncyB7XG4gIHRhcmdldEZvbGRlcjogc3RyaW5nO1xuICBpbWFnZXNGb2xkZXI6IHN0cmluZztcbiAgbGFuZ3VhZ2VQcmVmZXJlbmNlOiBcImVuXCIgfCBcImRlXCI7XG4gIHNhdmVJbWFnZXNMb2NhbGx5OiBib29sZWFuO1xuICBpbnNlcnRJbWFnZUlubGluZTogYm9vbGVhbjtcbiAgZXhjbHVkZWRTZXRzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNjcnlmYWxsU2V0dGluZ3MgPSB7XG4gIHRhcmdldEZvbGRlcjogXCJDYXJkc1wiLFxuICBpbWFnZXNGb2xkZXI6IFwiQ2FyZHMvaW1hZ2VzXCIsXG4gIGxhbmd1YWdlUHJlZmVyZW5jZTogXCJlblwiLFxuICBzYXZlSW1hZ2VzTG9jYWxseTogZmFsc2UsXG4gIGluc2VydEltYWdlSW5saW5lOiBmYWxzZSxcbiAgZXhjbHVkZWRTZXRzOiBbXSxcbn07XG5cbmNvbnN0IFNFVF9UWVBFX0dST1VQUzogQXJyYXk8eyBsYWJlbDogc3RyaW5nOyB0eXBlczogc3RyaW5nW10gfT4gPSBbXG4gIHsgbGFiZWw6IFwiRXhwYW5zaW9ucyAmIENvcmUgU2V0c1wiLCB0eXBlczogW1wiZXhwYW5zaW9uXCIsIFwiY29yZVwiXSB9LFxuICB7IGxhYmVsOiBcIk1hc3RlcnMgU2V0c1wiLCB0eXBlczogW1wibWFzdGVyc1wiXSB9LFxuICB7IGxhYmVsOiBcIkNvbW1hbmRlciAmIFNwZWNpYWx0eVwiLCB0eXBlczogW1wiY29tbWFuZGVyXCIsIFwiZHJhZnRfaW5ub3ZhdGlvblwiLCBcInBsYW5lY2hhc2VcIiwgXCJhcmNoZW5lbXlcIiwgXCJ2YW5ndWFyZFwiXSB9LFxuICB7IGxhYmVsOiBcIlByb21vICYgRXh0cmFzXCIsIHR5cGVzOiBbXCJwcm9tb1wiLCBcInRva2VuXCIsIFwibWVtb3JhYmlsaWFcIiwgXCJtaW5pZ2FtZVwiXSB9LFxuXTtcblxuZnVuY3Rpb24gbm9ybWFsaXplU2V0VHlwZShzZXRfdHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgZm9yIChjb25zdCBncm91cCBvZiBTRVRfVFlQRV9HUk9VUFMpIHtcbiAgICBpZiAoZ3JvdXAudHlwZXMuaW5jbHVkZXMoc2V0X3R5cGUpKSByZXR1cm4gZ3JvdXAubGFiZWw7XG4gIH1cbiAgcmV0dXJuIFwiT3RoZXJcIjtcbn1cblxuY2xhc3MgU2V0U3VnZ2VzdCBleHRlbmRzIEFic3RyYWN0SW5wdXRTdWdnZXN0PFNjcnlmYWxsU2V0SW5mbz4ge1xuICBwcml2YXRlIGdldFNldHM6ICgpID0+IFNjcnlmYWxsU2V0SW5mb1tdO1xuICBwcml2YXRlIG9uU2VsZWN0OiAoc2V0OiBTY3J5ZmFsbFNldEluZm8pID0+IHZvaWQ7XG4gIHByaXZhdGUgbGFzdFJlbmRlcmVkR3JvdXAgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIGlucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgZ2V0U2V0czogKCkgPT4gU2NyeWZhbGxTZXRJbmZvW10sXG4gICAgb25TZWxlY3Q6IChzZXQ6IFNjcnlmYWxsU2V0SW5mbykgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHAsIGlucHV0RWwpO1xuICAgIHRoaXMuZ2V0U2V0cyA9IGdldFNldHM7XG4gICAgdGhpcy5vblNlbGVjdCA9IG9uU2VsZWN0O1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMocXVlcnk6IHN0cmluZyk6IFNjcnlmYWxsU2V0SW5mb1tdIHtcbiAgICBjb25zdCBxID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IHRoaXMuZ2V0U2V0cygpXG4gICAgICAuZmlsdGVyKHMgPT4gcy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkgfHwgcy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkpO1xuXG4gICAgLy8gU29ydCBieSBub3JtYWxpemVkIGdyb3VwIHNvIHNhbWUtdHlwZSBzZXRzIGFwcGVhciB0b2dldGhlclxuICAgIGZpbHRlcmVkLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGdhID0gbm9ybWFsaXplU2V0VHlwZShhLnNldF90eXBlKTtcbiAgICAgIGNvbnN0IGdiID0gbm9ybWFsaXplU2V0VHlwZShiLnNldF90eXBlKTtcbiAgICAgIGlmIChnYSAhPT0gZ2IpIHJldHVybiBnYS5sb2NhbGVDb21wYXJlKGdiKTtcbiAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5sYXN0UmVuZGVyZWRHcm91cCA9IFwiXCI7XG4gICAgcmV0dXJuIGZpbHRlcmVkLnNsaWNlKDAsIDMwKTtcbiAgfVxuXG4gIHJlbmRlclN1Z2dlc3Rpb24oc2V0OiBTY3J5ZmFsbFNldEluZm8sIGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGdyb3VwID0gbm9ybWFsaXplU2V0VHlwZShzZXQuc2V0X3R5cGUpO1xuICAgIGlmIChncm91cCAhPT0gdGhpcy5sYXN0UmVuZGVyZWRHcm91cCkge1xuICAgICAgdGhpcy5sYXN0UmVuZGVyZWRHcm91cCA9IGdyb3VwO1xuICAgICAgZWwuY3JlYXRlRGl2KHsgY2xzOiBcInNjcnlmYWxsLXNldC1ncm91cC1zZXBhcmF0b3JcIiwgdGV4dDogZ3JvdXAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJvdyA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJzY3J5ZmFsbC1zZXQtcm93XCIgfSk7XG4gICAgcm93LmNyZWF0ZVNwYW4oeyB0ZXh0OiBzZXQubmFtZSB9KTtcbiAgICByb3cuY3JlYXRlU3Bhbih7IGNsczogXCJzY3J5ZmFsbC1zZXQtY29kZVwiLCB0ZXh0OiBgICgke3NldC5jb2RlfSlgIH0pO1xuICB9XG5cbiAgc2VsZWN0U3VnZ2VzdGlvbihzZXQ6IFNjcnlmYWxsU2V0SW5mbyk6IHZvaWQge1xuICAgIHRoaXMub25TZWxlY3Qoc2V0KTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjcnlmYWxsU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IFNjcnlmYWxsUGx1Z2luO1xuICBwcml2YXRlIGFsbFNldHM6IFNjcnlmYWxsU2V0SW5mb1tdID0gW107XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU2NyeWZhbGxQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBhc3luYyBkaXNwbGF5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIC8vIEZldGNoIHNldHMgaW4gdGhlIGJhY2tncm91bmQgd2hlbiB0YWIgb3BlbnNcbiAgICBpZiAodGhpcy5hbGxTZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZmV0Y2hBbGxTZXRzKCkudGhlbihzZXRzID0+IHsgdGhpcy5hbGxTZXRzID0gc2V0czsgfSk7XG4gICAgfVxuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiSG93IHRvIHVzZVwiIH0pO1xuICAgIGNvbnN0IGhvd1RvID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwic2NyeWZhbGwtaG93dG9cIiB9KTtcbiAgICBob3dUby5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJPcGVuIHRoZSBjb21tYW5kIHBhbGV0dGUgKENtZC9DdHJsICsgUCkgYW5kIHJ1biBcXFwiU2NyeWZhbGw6IEluc2VydCBjYXJkXFxcIi4gVHlwZSBhIGNhcmQgbmFtZSB0byBzZWFyY2ggXHUyMDE0IHJlc3VsdHMgYXBwZWFyIGFzIHlvdSB0eXBlLiBTZWxlY3RpbmcgYSBjYXJkOlwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGxpc3QgPSBob3dUby5jcmVhdGVFbChcIm9sXCIpO1xuICAgIGxpc3QuY3JlYXRlRWwoXCJsaVwiLCB7IHRleHQ6IFwiQ3JlYXRlcyAob3IgdXBkYXRlcykgYSBub3RlIGluIHRoZSBjYXJkIG5vdGVzIGZvbGRlciB3aXRoIGZ1bGwgY2FyZCBkYXRhIGFzIGZyb250bWF0dGVyLlwiIH0pO1xuICAgIGxpc3QuY3JlYXRlRWwoXCJsaVwiLCB7IHRleHQ6IFwiSW5zZXJ0cyBhIFtbd2lraWxpbmtdXSB0byB0aGF0IG5vdGUgYXQgeW91ciBjdXJzb3IgcG9zaXRpb24uXCIgfSk7XG4gICAgaG93VG8uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiWW91IGNhbiBhbHNvIGFzc2lnbiBhIGN1c3RvbSBob3RrZXkgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMgXHUyMTkyIHNlYXJjaCBcXFwiU2NyeWZhbGxcXFwiLlwiLFxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDYXJkIG5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJWYXVsdCBmb2xkZXIgd2hlcmUgY2FyZCBub3RlcyBhcmUgc2F2ZWQuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNhcmRzXCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRhcmdldEZvbGRlcilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXJnZXRGb2xkZXIgPSB2YWx1ZSB8fCBcIkNhcmRzXCI7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTGFuZ3VhZ2UgcHJlZmVyZW5jZVwiKVxuICAgICAgLnNldERlc2MoXCJXaGljaCBsYW5ndWFnZSB0byBzZWFyY2ggZmlyc3QuIFRoZSBvdGhlciBpcyB1c2VkIGFzIGZhbGxiYWNrLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wKSA9PlxuICAgICAgICBkcm9wXG4gICAgICAgICAgLmFkZE9wdGlvbihcImVuXCIsIFwiRW5nbGlzaFwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJkZVwiLCBcIkdlcm1hblwiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5sYW5ndWFnZVByZWZlcmVuY2UpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubGFuZ3VhZ2VQcmVmZXJlbmNlID0gdmFsdWUgYXMgXCJlblwiIHwgXCJkZVwiO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNhdmUgaW1hZ2VzIGxvY2FsbHlcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRvd25sb2FkIGNhcmQgaW1hZ2VzIGludG8gdGhlIHZhdWx0ICh+MTAwIEtCIHBlciBjYXJkKS4gV2hlbiBvZmYsIG9ubHkgdGhlIFNjcnlmYWxsIENETiBVUkwgaXMgc3RvcmVkLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYXZlSW1hZ2VzTG9jYWxseSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYXZlSW1hZ2VzTG9jYWxseSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2F2ZUltYWdlc0xvY2FsbHkpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkltYWdlcyBmb2xkZXJcIilcbiAgICAgICAgLnNldERlc2MoXCJWYXVsdCBmb2xkZXIgd2hlcmUgY2FyZCBpbWFnZXMgYXJlIGRvd25sb2FkZWQuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNhcmRzL2ltYWdlc1wiKVxuICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlc0ZvbGRlcilcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VzRm9sZGVyID0gdmFsdWUgfHwgXCJDYXJkcy9pbWFnZXNcIjtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5zZXJ0IGltYWdlIGlubGluZVwiKVxuICAgICAgLnNldERlc2MoXCJBbHNvIGluc2VydCBhbiBpbWFnZSBlbWJlZCBiZWxvdyB0aGUgd2lraWxpbmsgd2hlbiBpbnNlcnRpbmcgYSBjYXJkLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zZXJ0SW1hZ2VJbmxpbmUpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zZXJ0SW1hZ2VJbmxpbmUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVEYXRhKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIC8vIC0tLSBFeGNsdWRlZCBzZXRzIC0tLVxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkV4Y2x1ZGVkIHNldHNcIiB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJDYXJkcyBmcm9tIGV4Y2x1ZGVkIHNldHMgd2lsbCBub3Qgc2hvdyBhcnR3b3JrIGluIHRoZSBzZWFyY2ggZHJvcGRvd24gb3IgaW4gY2FyZCBub3Rlcy5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGV4Y2x1ZGVkU2V0cyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVkU2V0cztcbiAgICBpZiAoZXhjbHVkZWRTZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGV4Y2x1c2lvbkxpc3QgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJzY3J5ZmFsbC1leGNsdXNpb24tbGlzdFwiIH0pO1xuICAgICAgZm9yIChjb25zdCBjb2RlIG9mIGV4Y2x1ZGVkU2V0cykge1xuICAgICAgICBjb25zdCByb3cgPSBleGNsdXNpb25MaXN0LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInNjcnlmYWxsLWV4Y2x1c2lvbi1yb3dcIiB9KTtcbiAgICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLmFsbFNldHMuZmluZChzID0+IHMuY29kZSA9PT0gY29kZSk/Lm5hbWUgPz8gY29kZTtcbiAgICAgICAgcm93LmNyZWF0ZVNwYW4oeyB0ZXh0OiBgJHtsYWJlbH0gKCR7Y29kZX0pYCB9KTtcbiAgICAgICAgY29uc3QgcmVtb3ZlQnRuID0gcm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTAwRDdcIiwgY2xzOiBcInNjcnlmYWxsLXJlbW92ZS1idG5cIiB9KTtcbiAgICAgICAgcmVtb3ZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZWRTZXRzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZWRTZXRzLmZpbHRlcihjID0+IGMgIT09IGNvZGUpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVEYXRhKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYWRkU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBZGQgZXhjbHVkZWQgc2V0XCIpXG4gICAgICAuc2V0RGVzYyhcIlR5cGUgYSBzZXQgbmFtZSBvciBjb2RlIHRvIHNlYXJjaC4gXCIpO1xuXG4gICAgLy8gQXBwZW5kIGZhbGxiYWNrIGxpbmsgdG8gdGhlIGRlc2NyaXB0aW9uXG4gICAgYWRkU2V0dGluZy5kZXNjRWwuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgIHRleHQ6IFwiQnJvd3NlIGFsbCBzZXRzIG9uIFNjcnlmYWxsXCIsXG4gICAgICBocmVmOiBcImh0dHBzOi8vc2NyeWZhbGwuY29tL3NldHNcIixcbiAgICB9KTtcblxuICAgIGFkZFNldHRpbmcuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgY29uc3QgaW5wdXRFbCA9IHRleHQuaW5wdXRFbCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgaW5wdXRFbC5hZGRDbGFzcyhcInNjcnlmYWxsLXNldC1pbnB1dFwiKTtcbiAgICAgIGNvbnN0IHN1Z2dlc3QgPSBuZXcgU2V0U3VnZ2VzdCh0aGlzLmFwcCwgaW5wdXRFbCwgKCkgPT4gdGhpcy5hbGxTZXRzLCBhc3luYyAoc2V0KSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZWRTZXRzLmluY2x1ZGVzKHNldC5jb2RlKSkge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVkU2V0cy5wdXNoKHNldC5jb2RlKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgfSk7XG4gICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiZS5nLiBTZWNyZXQgTGFpciBEcm9wXCIpO1xuICAgICAgKGlucHV0RWwgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgX3NjcnlmYWxsU3VnZ2VzdD86IFNldFN1Z2dlc3QgfSkuX3NjcnlmYWxsU3VnZ2VzdCA9IHN1Z2dlc3Q7XG4gICAgfSk7XG4gIH1cbn1cbiIsICIvLyByZXF1ZXN0VXJsIGlzIGludGVudGlvbmFsbHkgdW51c2VkIFx1MjAxNCB3ZSB1c2UgZmV0Y2ggZGlyZWN0bHkgZm9yIGZ1bGwgaGVhZGVyIGNvbnRyb2xcblxuY29uc3QgU0NSWUZBTExfSEVBREVSUyA9IHtcbiAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gIFwiVXNlci1BZ2VudFwiOiBcInNjcnlmYWxsLW9ic2lkaWFuLXBsdWdpbi8xLjBcIixcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NyeWZhbGxTZXRJbmZvIHtcbiAgY29kZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHNldF90eXBlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NyeWZhbGxDYXJkIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBwcmludGVkX25hbWU/OiBzdHJpbmc7IC8vIGxvY2FsaXplZCBuYW1lIChlLmcuIEdlcm1hbilcbiAgbWFuYV9jb3N0Pzogc3RyaW5nO1xuICB0eXBlX2xpbmU6IHN0cmluZztcbiAgb3JhY2xlX3RleHQ/OiBzdHJpbmc7XG4gIHNldDogc3RyaW5nO1xuICBzZXRfbmFtZTogc3RyaW5nO1xuICByYXJpdHk6IHN0cmluZztcbiAgbGVnYWxpdGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgaW1hZ2VfdXJpcz86IHtcbiAgICBzbWFsbDogc3RyaW5nO1xuICAgIG5vcm1hbDogc3RyaW5nO1xuICAgIGxhcmdlOiBzdHJpbmc7XG4gICAgcG5nOiBzdHJpbmc7XG4gIH07XG4gIGNhcmRfZmFjZXM/OiBBcnJheTx7XG4gICAgaW1hZ2VfdXJpcz86IHsgc21hbGw6IHN0cmluZzsgbm9ybWFsOiBzdHJpbmc7IGxhcmdlOiBzdHJpbmc7IHBuZzogc3RyaW5nIH07XG4gIH0+O1xuICBsYW5nOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBTY3J5ZmFsbFNlYXJjaFJlc3BvbnNlIHtcbiAgZGF0YTogU2NyeWZhbGxDYXJkW107XG4gIHRvdGFsX2NhcmRzOiBudW1iZXI7XG59XG5cbmNvbnN0IEJBU0VfVVJMID0gXCJodHRwczovL2FwaS5zY3J5ZmFsbC5jb21cIjtcblxuYXN5bmMgZnVuY3Rpb24gc2VhcmNoQ2FyZHMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8U2NyeWZhbGxDYXJkW10+IHtcbiAgY29uc3QgdXJsID0gYCR7QkFTRV9VUkx9L2NhcmRzL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0mdW5pcXVlPWNhcmRzJm9yZGVyPW5hbWVgO1xuICBjb25zb2xlLmxvZyhcIltTY3J5ZmFsbF0gZmV0Y2hpbmc6XCIsIHVybCk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGhlYWRlcnM6IFNDUllGQUxMX0hFQURFUlMgfSk7XG4gICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIHJlc3BvbnNlIHN0YXR1czpcIiwgcmVzLnN0YXR1cyk7XG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltTY3J5ZmFsbF0gbm9uLW9rIHJlc3BvbnNlOlwiLCByZXMuc3RhdHVzLCByZXMuc3RhdHVzVGV4dCk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXMuanNvbigpIGFzIFNjcnlmYWxsU2VhcmNoUmVzcG9uc2U7XG4gICAgcmV0dXJuIGJvZHkuZGF0YSA/PyBbXTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUud2FybihcIltTY3J5ZmFsbF0gc2VhcmNoQ2FyZHMgZXJyb3I6XCIsIGUpO1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG4vKipcbiAqIFR3by1wYXNzIHNlYXJjaDogcHJpbWFyeSBsYW5ndWFnZSBmaXJzdCwgdGhlbiBmYWxsYmFjay5cbiAqIERlZHVwbGljYXRlcyBieSBTY3J5ZmFsbCBjYXJkIElELlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VhcmNoQnlOYW1lKFxuICB0ZXJtOiBzdHJpbmcsXG4gIHByaW1hcnlMYW5nOiBcImVuXCIgfCBcImRlXCJcbik6IFByb21pc2U8U2NyeWZhbGxDYXJkW10+IHtcbiAgY29uc3QgW3ByaW1hcnlRdWVyeSwgZmFsbGJhY2tRdWVyeV0gPVxuICAgIHByaW1hcnlMYW5nID09PSBcImVuXCJcbiAgICAgID8gW2BuYW1lOiR7dGVybX1gLCBgbmFtZToke3Rlcm19IGxhbmc6ZGVgXVxuICAgICAgOiBbYG5hbWU6JHt0ZXJtfSBsYW5nOmRlYCwgYG5hbWU6JHt0ZXJtfWBdO1xuXG4gIGNvbnN0IHByaW1hcnlSZXN1bHRzID0gYXdhaXQgc2VhcmNoQ2FyZHMocHJpbWFyeVF1ZXJ5KTtcblxuICAvLyBPbmx5IHJ1biBmYWxsYmFjayBpZiBwcmltYXJ5IHJldHVybmVkIG5vdGhpbmdcbiAgY29uc3QgZmFsbGJhY2tSZXN1bHRzID1cbiAgICBwcmltYXJ5UmVzdWx0cy5sZW5ndGggPT09IDAgPyBhd2FpdCBzZWFyY2hDYXJkcyhmYWxsYmFja1F1ZXJ5KSA6IFtdO1xuXG4gIC8vIE1lcmdlIGFuZCBkZWR1cGxpY2F0ZSBieSBjYXJkIElEXG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWVyZ2VkOiBTY3J5ZmFsbENhcmRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGNhcmQgb2YgWy4uLnByaW1hcnlSZXN1bHRzLCAuLi5mYWxsYmFja1Jlc3VsdHNdKSB7XG4gICAgaWYgKCFzZWVuLmhhcyhjYXJkLmlkKSkge1xuICAgICAgc2Vlbi5hZGQoY2FyZC5pZCk7XG4gICAgICBtZXJnZWQucHVzaChjYXJkKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1lcmdlZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbWFnZSBVUkwgZm9yIGEgY2FyZCAoZnJvbnQgZmFjZSwgbm9ybWFsIHNpemUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FyZEltYWdlVXJsKGNhcmQ6IFNjcnlmYWxsQ2FyZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiAoXG4gICAgY2FyZC5pbWFnZV91cmlzPy5ub3JtYWwgPz9cbiAgICBjYXJkLmNhcmRfZmFjZXM/LlswXT8uaW1hZ2VfdXJpcz8ubm9ybWFsXG4gICk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc21hbGwgdGh1bWJuYWlsIFVSTCBmb3IgYSBjYXJkIChmcm9udCBmYWNlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhcmRTbWFsbEltYWdlVXJsKGNhcmQ6IFNjcnlmYWxsQ2FyZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiAoXG4gICAgY2FyZC5pbWFnZV91cmlzPy5zbWFsbCA/P1xuICAgIGNhcmQuY2FyZF9mYWNlcz8uWzBdPy5pbWFnZV91cmlzPy5zbWFsbFxuICApO1xufVxuXG4vKipcbiAqIEZldGNoZXMgYWxsIHNldHMgZnJvbSB0aGUgU2NyeWZhbGwgQVBJLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbGxTZXRzKCk6IFByb21pc2U8U2NyeWZhbGxTZXRJbmZvW10+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQVNFX1VSTH0vc2V0c2AsIHsgaGVhZGVyczogU0NSWUZBTExfSEVBREVSUyB9KTtcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXMuanNvbigpIGFzIHsgZGF0YTogQXJyYXk8eyBjb2RlOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgc2V0X3R5cGU6IHN0cmluZyB9PiB9O1xuICAgIHJldHVybiAoYm9keS5kYXRhID8/IFtdKS5tYXAocyA9PiAoeyBjb2RlOiBzLmNvZGUsIG5hbWU6IHMubmFtZSwgc2V0X3R5cGU6IHMuc2V0X3R5cGUgPz8gXCJcIiB9KSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG4vKipcbiAqIERvd25sb2FkcyBhIGNhcmQgaW1hZ2UgYW5kIHJldHVybnMgaXQgYXMgYW4gQXJyYXlCdWZmZXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEltYWdlKHVybDogc3RyaW5nKTogUHJvbWlzZTxBcnJheUJ1ZmZlciB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGlmICghcmVzLm9rKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYXdhaXQgcmVzLmFycmF5QnVmZmVyKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBFZGl0b3IsIE5vdGljZSwgU3VnZ2VzdE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTY3J5ZmFsbENhcmQsIHNlYXJjaEJ5TmFtZSwgZ2V0Q2FyZEltYWdlVXJsLCBnZXRDYXJkU21hbGxJbWFnZVVybCB9IGZyb20gXCIuL3NjcnlmYWxsXCI7XG5pbXBvcnQgeyB1cHNlcnRDYXJkTm90ZSB9IGZyb20gXCIuL25vdGUtd3JpdGVyXCI7XG5pbXBvcnQgdHlwZSBTY3J5ZmFsbFBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5cbmNvbnN0IFNZTUJPTF9CQVNFID0gXCJodHRwczovL3N2Z3Muc2NyeWZhbGwuaW8vY2FyZC1zeW1ib2xzL1wiO1xuXG5mdW5jdGlvbiByZW5kZXJNYW5hQ29zdChjb250YWluZXI6IEhUTUxFbGVtZW50LCBtYW5hQ29zdDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRva2VucyA9IFsuLi5tYW5hQ29zdC5tYXRjaEFsbCgvXFx7KFtefV0rKVxcfS9nKV07XG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdG9rZW5zKSB7XG4gICAgY29uc3QgY29kZSA9IG1hdGNoWzFdLnJlcGxhY2UoL1xcLy9nLCBcIlwiKTtcbiAgICBjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoXCJpbWdcIiwgeyBjbHM6IFwic2NyeWZhbGwtbWFuYS1zeW1ib2xcIiB9KTtcbiAgICBpbWcuc3JjID0gYCR7U1lNQk9MX0JBU0V9JHtjb2RlfS5zdmdgO1xuICAgIGltZy53aWR0aCA9IDE2O1xuICAgIGltZy5oZWlnaHQgPSAxNjtcbiAgICBpbWcuYWx0ID0gbWF0Y2hbMV07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjcnlmYWxsU2VhcmNoTW9kYWwgZXh0ZW5kcyBTdWdnZXN0TW9kYWw8U2NyeWZhbGxDYXJkPiB7XG4gIHByaXZhdGUgcGx1Z2luOiBTY3J5ZmFsbFBsdWdpbjtcbiAgcHJpdmF0ZSBlZGl0b3I6IEVkaXRvciB8IG51bGw7XG4gIHByaXZhdGUgZGVib3VuY2VUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVzb2x2ZTogKChjYXJkczogU2NyeWZhbGxDYXJkW10pID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZm91bmRWaWFHZXJtYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTY3J5ZmFsbFBsdWdpbiwgZWRpdG9yOiBFZGl0b3IgfCBudWxsKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICB0aGlzLnNldFBsYWNlaG9sZGVyKFwiU2VhcmNoIGZvciBhIE1hZ2ljIGNhcmRcdTIwMjZcIik7XG4gICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIG1vZGFsIGNvbnN0cnVjdGVkXCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8U2NyeWZhbGxDYXJkW10+IHtcbiAgICBjb25zb2xlLmxvZyhcIltTY3J5ZmFsbF0gZ2V0U3VnZ2VzdGlvbnMgY2FsbGVkLCBxdWVyeTpcIiwgcXVlcnkpO1xuXG4gICAgaWYgKHRoaXMucGVuZGluZ1Jlc29sdmUpIHtcbiAgICAgIHRoaXMucGVuZGluZ1Jlc29sdmUoW10pO1xuICAgICAgdGhpcy5wZW5kaW5nUmVzb2x2ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLmRlYm91bmNlVGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmRlYm91bmNlVGltZXIpO1xuICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIXF1ZXJ5LnRyaW0oKSkgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnBlbmRpbmdSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMuZGVib3VuY2VUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnBlbmRpbmdSZXNvbHZlID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy51cGRhdGVMb2FkaW5nSW5kaWNhdG9yKHRydWUpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIltTY3J5ZmFsbF0gZGVib3VuY2UgZmlyZWQsIGZldGNoaW5nOlwiLCBxdWVyeSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNlYXJjaEJ5TmFtZShcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubGFuZ3VhZ2VQcmVmZXJlbmNlXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIltTY3J5ZmFsbF0gc2VhcmNoIHJlc3VsdHM6XCIsIHJlc3VsdHMubGVuZ3RoKTtcbiAgICAgICAgICB0aGlzLmZvdW5kVmlhR2VybWFuID0gcmVzdWx0cy5sZW5ndGggPiAwICYmIHJlc3VsdHNbMF0ubGFuZyAhPT0gXCJlblwiO1xuICAgICAgICAgIHJlc29sdmUocmVzdWx0cy5zbGljZSgwLCAxMCkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltTY3J5ZmFsbF0gc2VhcmNoIGVycm9yOlwiLCBlKTtcbiAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdJbmRpY2F0b3IoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyU3VnZ2VzdGlvbihjYXJkOiBTY3J5ZmFsbENhcmQsIGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGVsLmFkZENsYXNzKFwic2NyeWZhbGwtc3VnZ2VzdGlvblwiKTtcbiAgICBjb25zdCBleGNsdWRlZCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVkU2V0cy5pbmNsdWRlcyhjYXJkLnNldCk7XG4gICAgY29uc3Qgc21hbGxVcmwgPSBleGNsdWRlZCA/IHVuZGVmaW5lZCA6IGdldENhcmRTbWFsbEltYWdlVXJsKGNhcmQpO1xuXG4gICAgaWYgKHNtYWxsVXJsKSB7XG4gICAgICBjb25zdCBpbWcgPSBlbC5jcmVhdGVFbChcImltZ1wiLCB7IGNsczogXCJzY3J5ZmFsbC10aHVtYlwiIH0pO1xuICAgICAgaW1nLnNyYyA9IHNtYWxsVXJsO1xuICAgICAgaW1nLmFsdCA9IGNhcmQubmFtZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmZvID0gZWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwic2NyeWZhbGwtY2FyZC1pbmZvXCIgfSk7XG4gICAgaW5mby5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJzY3J5ZmFsbC1jYXJkLW5hbWVcIiwgdGV4dDogY2FyZC5uYW1lIH0pO1xuICAgIGlmIChjYXJkLm1hbmFfY29zdCkge1xuICAgICAgY29uc3QgbWFuYVJvdyA9IGluZm8uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwic2NyeWZhbGwtY2FyZC1tYW5hXCIgfSk7XG4gICAgICByZW5kZXJNYW5hQ29zdChtYW5hUm93LCBjYXJkLm1hbmFfY29zdCk7XG4gICAgfVxuICAgIGNvbnN0IHNldFJvdyA9IGluZm8uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwic2NyeWZhbGwtY2FyZC1zZXRcIiB9KTtcbiAgICBzZXRSb3cuYXBwZW5kVGV4dChjYXJkLnNldF9uYW1lKTtcbiAgICBpZiAoY2FyZC5sYW5nICE9PSBcImVuXCIpIHNldFJvdy5hcHBlbmRUZXh0KGAgXHUwMEI3ICR7Y2FyZC5sYW5nLnRvVXBwZXJDYXNlKCl9YCk7XG4gIH1cblxuICBhc3luYyBvbkNob29zZVN1Z2dlc3Rpb24oY2FyZDogU2NyeWZhbGxDYXJkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coXCJbU2NyeWZhbGxdIGNhcmQgY2hvc2VuOlwiLCBjYXJkLm5hbWUpO1xuICAgIGNvbnN0IHsgbm90ZVBhdGggfSA9IGF3YWl0IHVwc2VydENhcmROb3RlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICBjYXJkLFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MsXG4gICAgICB0aGlzLmZvdW5kVmlhR2VybWFuXG4gICAgKTtcblxuICAgIGNvbnN0IG5vdGVOYW1lID0gbm90ZVBhdGgucmVwbGFjZSgvXi4qXFwvLywgXCJcIikucmVwbGFjZSgvXFwubWQkLywgXCJcIik7XG4gICAgbGV0IGluc2VydFRleHQgPSBgW1ske25vdGVOYW1lfV1dYDtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnNlcnRJbWFnZUlubGluZSkge1xuICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhdmVJbWFnZXNMb2NhbGx5KSB7XG4gICAgICAgIGNvbnN0IGltZ05hbWUgPSBgJHtjYXJkLmlkfS5wbmdgO1xuICAgICAgICBpbnNlcnRUZXh0ICs9IGBcXG4hW1ske2ltZ05hbWV9XV1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdXJsID0gZ2V0Q2FyZEltYWdlVXJsKGNhcmQpO1xuICAgICAgICBpZiAodXJsKSBpbnNlcnRUZXh0ICs9IGBcXG4hWyR7Y2FyZC5uYW1lfV0oJHt1cmx9KWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICB0aGlzLmVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGluc2VydFRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgTm90aWNlKGBDYXJkIG5vdGUgY3JlYXRlZDogJHtub3RlTmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUxvYWRpbmdJbmRpY2F0b3IobG9hZGluZzogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICB0aGlzLmlucHV0RWwuYWRkQ2xhc3MoXCJzY3J5ZmFsbC1sb2FkaW5nXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlucHV0RWwucmVtb3ZlQ2xhc3MoXCJzY3J5ZmFsbC1sb2FkaW5nXCIpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFNjcnlmYWxsQ2FyZCwgZG93bmxvYWRJbWFnZSwgZ2V0Q2FyZEltYWdlVXJsIH0gZnJvbSBcIi4vc2NyeWZhbGxcIjtcbmltcG9ydCB7IFNjcnlmYWxsU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG5pbnRlcmZhY2UgTm90ZUZpZWxkcyB7XG4gIHNjcnlmYWxsX2lkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbmFtZV9kZT86IHN0cmluZztcbiAgbWFuYV9jb3N0Pzogc3RyaW5nO1xuICB0eXBlX2xpbmU6IHN0cmluZztcbiAgb3JhY2xlX3RleHQ/OiBzdHJpbmc7XG4gIHNldDogc3RyaW5nO1xuICBzZXRfbmFtZTogc3RyaW5nO1xuICByYXJpdHk6IHN0cmluZztcbiAgbGVnYWxpdGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgaW1hZ2VfdXJsPzogc3RyaW5nO1xuICBpbWFnZV9sb2NhbD86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplRnJvbnRtYXR0ZXIoZmllbGRzOiBOb3RlRmllbGRzKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW1wiLS0tXCJdO1xuICBsaW5lcy5wdXNoKGBzY3J5ZmFsbF9pZDogXCIke2ZpZWxkcy5zY3J5ZmFsbF9pZH1cImApO1xuICBsaW5lcy5wdXNoKGBuYW1lOiBcIiR7ZXNjYXBlWWFtbChmaWVsZHMubmFtZSl9XCJgKTtcbiAgaWYgKGZpZWxkcy5uYW1lX2RlKSBsaW5lcy5wdXNoKGBuYW1lX2RlOiBcIiR7ZXNjYXBlWWFtbChmaWVsZHMubmFtZV9kZSl9XCJgKTtcbiAgaWYgKGZpZWxkcy5tYW5hX2Nvc3QpIGxpbmVzLnB1c2goYG1hbmFfY29zdDogXCIke2VzY2FwZVlhbWwoZmllbGRzLm1hbmFfY29zdCl9XCJgKTtcbiAgbGluZXMucHVzaChgdHlwZV9saW5lOiBcIiR7ZXNjYXBlWWFtbChmaWVsZHMudHlwZV9saW5lKX1cImApO1xuICBpZiAoZmllbGRzLm9yYWNsZV90ZXh0KVxuICAgIGxpbmVzLnB1c2goYG9yYWNsZV90ZXh0OiBcIiR7ZXNjYXBlWWFtbChmaWVsZHMub3JhY2xlX3RleHQpfVwiYCk7XG4gIGxpbmVzLnB1c2goYHNldDogXCIke2ZpZWxkcy5zZXR9XCJgKTtcbiAgbGluZXMucHVzaChgc2V0X25hbWU6IFwiJHtlc2NhcGVZYW1sKGZpZWxkcy5zZXRfbmFtZSl9XCJgKTtcbiAgbGluZXMucHVzaChgcmFyaXR5OiBcIiR7ZmllbGRzLnJhcml0eX1cImApO1xuICBpZiAoZmllbGRzLmltYWdlX3VybCkgbGluZXMucHVzaChgaW1hZ2VfdXJsOiBcIiR7ZmllbGRzLmltYWdlX3VybH1cImApO1xuICBpZiAoZmllbGRzLmltYWdlX2xvY2FsKSBsaW5lcy5wdXNoKGBpbWFnZV9sb2NhbDogXCIke2ZpZWxkcy5pbWFnZV9sb2NhbH1cImApO1xuICBsaW5lcy5wdXNoKFwibGVnYWxpdGllczpcIik7XG4gIGZvciAoY29uc3QgW2Zvcm1hdCwgc3RhdHVzXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMubGVnYWxpdGllcykpIHtcbiAgICBsaW5lcy5wdXNoKGAgICR7Zm9ybWF0fTogXCIke3N0YXR1c31cImApO1xuICB9XG4gIGxpbmVzLnB1c2goXCItLS1cIik7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVZYW1sKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXFxcL2csIFwiXFxcXFxcXFxcIikucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpLnJlcGxhY2UoL1xcbi9nLCBcIlxcXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZUZpbGVuYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBuYW1lLnJlcGxhY2UoL1tcXFxcLzoqP1wiPD58XS9nLCBcIlwiKS50cmltKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZvbGRlcihhcHA6IEFwcCwgZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlclBhdGgpO1xuICBpZiAoIWFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlRm9sZGVyKG5vcm1hbGl6ZWQpO1xuICB9XG59XG5cbi8qKlxuICogU2NhbnMgdGhlIHRhcmdldCBmb2xkZXIgZm9yIGEgbm90ZSB3aG9zZSBmcm9udG1hdHRlciBjb250YWlucyB0aGUgZ2l2ZW4gc2NyeWZhbGxfaWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRFeGlzdGluZ05vdGUoXG4gIGFwcDogQXBwLFxuICB0YXJnZXRGb2xkZXI6IHN0cmluZyxcbiAgc2NyeWZhbGxJZDogc3RyaW5nXG4pOiBQcm9taXNlPFRGaWxlIHwgbnVsbD4ge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aCh0YXJnZXRGb2xkZXIpO1xuICBjb25zdCBmb2xkZXIgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgZmlsZXMgPSBhcHAudmF1bHRcbiAgICAuZ2V0RmlsZXMoKVxuICAgIC5maWx0ZXIoKGYpID0+IGYucGF0aC5zdGFydHNXaXRoKG5vcm1hbGl6ZWQgKyBcIi9cIikgJiYgZi5leHRlbnNpb24gPT09IFwibWRcIik7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uc2NyeWZhbGxfaWQgPT09IHNjcnlmYWxsSWQpIHtcbiAgICAgIHJldHVybiBmaWxlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgZmlsZSBwYXRoIGZvciBhIGNhcmQgbm90ZSwgaGFuZGxpbmcgZmlsZW5hbWUgY29sbGlzaW9ucy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZU5vdGVQYXRoKFxuICBhcHA6IEFwcCxcbiAgdGFyZ2V0Rm9sZGVyOiBzdHJpbmcsXG4gIGNhcmQ6IFNjcnlmYWxsQ2FyZCxcbiAgZXhpc3RpbmdGaWxlOiBURmlsZSB8IG51bGxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmIChleGlzdGluZ0ZpbGUpIHJldHVybiBleGlzdGluZ0ZpbGUucGF0aDtcblxuICBjb25zdCBiYXNlTmFtZSA9IHNhbml0aXplRmlsZW5hbWUoY2FyZC5uYW1lKTtcbiAgY29uc3QgY2FuZGlkYXRlID0gbm9ybWFsaXplUGF0aChgJHt0YXJnZXRGb2xkZXJ9LyR7YmFzZU5hbWV9Lm1kYCk7XG4gIGNvbnN0IGV4aXN0aW5nID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpO1xuXG4gIGlmICghZXhpc3RpbmcpIHJldHVybiBjYW5kaWRhdGU7XG5cbiAgLy8gQ29sbGlzaW9uOiBkaWZmZXJlbnQgY2FyZCBoYXMgc2FtZSBuYW1lIFx1MjAxNCBhcHBlbmQgc2V0IGNvZGVcbiAgcmV0dXJuIG5vcm1hbGl6ZVBhdGgoYCR7dGFyZ2V0Rm9sZGVyfS8ke2Jhc2VOYW1lfSAoJHtjYXJkLnNldC50b1VwcGVyQ2FzZSgpfSkubWRgKTtcbn1cblxuY29uc3QgSU1BR0VfTElORV9SRSA9IC9eIVxcWy4qP1xcXVxcKC4qP1xcKXxeIVxcW1xcWy4qP1xcXVxcXS87XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW1hZ2UgZW1iZWQgbGluZSBmb3IgdGhlIG5vdGUgYm9keSwgb3IgbnVsbCBpZiBleGNsdWRlZC9ubyBpbWFnZS5cbiAqL1xuZnVuY3Rpb24gYnVpbGRJbWFnZUxpbmUoY2FyZDogU2NyeWZhbGxDYXJkLCBzZXR0aW5nczogU2NyeWZhbGxTZXR0aW5ncyk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoc2V0dGluZ3MuZXhjbHVkZWRTZXRzLmluY2x1ZGVzKGNhcmQuc2V0KSkgcmV0dXJuIG51bGw7XG5cbiAgaWYgKHNldHRpbmdzLnNhdmVJbWFnZXNMb2NhbGx5KSB7XG4gICAgY29uc3QgaW1hZ2VQYXRoID0gbm9ybWFsaXplUGF0aChgJHtzZXR0aW5ncy5pbWFnZXNGb2xkZXJ9LyR7Y2FyZC5pZH0ucG5nYCk7XG4gICAgcmV0dXJuIGAhW1ske2ltYWdlUGF0aH1dXWA7XG4gIH1cblxuICBjb25zdCB1cmwgPSBnZXRDYXJkSW1hZ2VVcmwoY2FyZCk7XG4gIGlmICghdXJsKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGAhWyR7Y2FyZC5uYW1lfV0oJHt1cmx9KWA7XG59XG5cbi8qKlxuICogR2l2ZW4gZXhpc3Rpbmcgbm90ZSBib2R5IHRleHQgKHdpdGhvdXQgZnJvbnRtYXR0ZXIpLCByZXBsYWNlcyBvciBwcmVwZW5kcyB0aGUgaW1hZ2UgbGluZS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlJbWFnZUxpbmUoYm9keTogc3RyaW5nLCBpbWFnZUxpbmU6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGJvZHkuc3BsaXQoXCJcXG5cIik7XG5cbiAgbGV0IGZpcnN0Q29udGVudElkeCA9IDA7XG4gIHdoaWxlIChmaXJzdENvbnRlbnRJZHggPCBsaW5lcy5sZW5ndGggJiYgbGluZXNbZmlyc3RDb250ZW50SWR4XS50cmltKCkgPT09IFwiXCIpIHtcbiAgICBmaXJzdENvbnRlbnRJZHgrKztcbiAgfVxuXG4gIGNvbnN0IGZpcnN0TGluZSA9IGxpbmVzW2ZpcnN0Q29udGVudElkeF0gPz8gXCJcIjtcbiAgY29uc3QgaGFzSW1hZ2VMaW5lID0gSU1BR0VfTElORV9SRS50ZXN0KGZpcnN0TGluZSk7XG5cbiAgaWYgKGltYWdlTGluZSA9PT0gbnVsbCkge1xuICAgIGlmIChoYXNJbWFnZUxpbmUpIGxpbmVzLnNwbGljZShmaXJzdENvbnRlbnRJZHgsIDEpO1xuICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgaWYgKGhhc0ltYWdlTGluZSkge1xuICAgIGxpbmVzW2ZpcnN0Q29udGVudElkeF0gPSBpbWFnZUxpbmU7XG4gIH0gZWxzZSB7XG4gICAgbGluZXMuc3BsaWNlKGZpcnN0Q29udGVudElkeCwgMCwgaW1hZ2VMaW5lLCBcIlwiKTtcbiAgfVxuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwc2VydENhcmROb3RlKFxuICBhcHA6IEFwcCxcbiAgY2FyZDogU2NyeWZhbGxDYXJkLFxuICBzZXR0aW5nczogU2NyeWZhbGxTZXR0aW5ncyxcbiAgZm91bmRWaWFHZXJtYW46IGJvb2xlYW5cbik6IFByb21pc2U8eyBmaWxlOiBURmlsZTsgbm90ZVBhdGg6IHN0cmluZyB9PiB7XG4gIGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIHNldHRpbmdzLnRhcmdldEZvbGRlcik7XG5cbiAgY29uc3QgZXhpc3RpbmdGaWxlID0gYXdhaXQgZmluZEV4aXN0aW5nTm90ZShhcHAsIHNldHRpbmdzLnRhcmdldEZvbGRlciwgY2FyZC5pZCk7XG4gIGNvbnN0IG5vdGVQYXRoID0gYXdhaXQgcmVzb2x2ZU5vdGVQYXRoKGFwcCwgc2V0dGluZ3MudGFyZ2V0Rm9sZGVyLCBjYXJkLCBleGlzdGluZ0ZpbGUpO1xuXG4gIGNvbnN0IGltYWdlVXJsID0gZ2V0Q2FyZEltYWdlVXJsKGNhcmQpO1xuICBsZXQgaW1hZ2VMb2NhbDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGlmIChzZXR0aW5ncy5zYXZlSW1hZ2VzTG9jYWxseSAmJiBpbWFnZVVybCkge1xuICAgIGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIHNldHRpbmdzLmltYWdlc0ZvbGRlcik7XG4gICAgY29uc3QgaW1hZ2VQYXRoID0gbm9ybWFsaXplUGF0aChgJHtzZXR0aW5ncy5pbWFnZXNGb2xkZXJ9LyR7Y2FyZC5pZH0ucG5nYCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGltYWdlUGF0aCk7XG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgZG93bmxvYWRJbWFnZShpbWFnZVVybCk7XG4gICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGVCaW5hcnkoaW1hZ2VQYXRoLCBidWZmZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpbWFnZUxvY2FsID0gaW1hZ2VQYXRoO1xuICB9XG5cbiAgY29uc3QgZmllbGRzOiBOb3RlRmllbGRzID0ge1xuICAgIHNjcnlmYWxsX2lkOiBjYXJkLmlkLFxuICAgIG5hbWU6IGNhcmQubmFtZSxcbiAgICBuYW1lX2RlOiBmb3VuZFZpYUdlcm1hbiAmJiBjYXJkLnByaW50ZWRfbmFtZSA/IGNhcmQucHJpbnRlZF9uYW1lIDogdW5kZWZpbmVkLFxuICAgIG1hbmFfY29zdDogY2FyZC5tYW5hX2Nvc3QsXG4gICAgdHlwZV9saW5lOiBjYXJkLnR5cGVfbGluZSxcbiAgICBvcmFjbGVfdGV4dDogY2FyZC5vcmFjbGVfdGV4dCxcbiAgICBzZXQ6IGNhcmQuc2V0LFxuICAgIHNldF9uYW1lOiBjYXJkLnNldF9uYW1lLFxuICAgIHJhcml0eTogY2FyZC5yYXJpdHksXG4gICAgbGVnYWxpdGllczogY2FyZC5sZWdhbGl0aWVzLFxuICAgIGltYWdlX3VybDogaW1hZ2VVcmwsXG4gICAgaW1hZ2VfbG9jYWw6IGltYWdlTG9jYWwsXG4gIH07XG5cbiAgY29uc3QgZnJvbnRtYXR0ZXIgPSBzZXJpYWxpemVGcm9udG1hdHRlcihmaWVsZHMpO1xuICBjb25zdCBpbWFnZUxpbmUgPSBidWlsZEltYWdlTGluZShjYXJkLCBzZXR0aW5ncyk7XG5cbiAgaWYgKGV4aXN0aW5nRmlsZSkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChleGlzdGluZ0ZpbGUpO1xuICAgIGNvbnN0IGZtTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbj8vKTtcbiAgICBjb25zdCBleGlzdGluZ0JvZHkgPSBmbU1hdGNoID8gY29udGVudC5zbGljZShmbU1hdGNoWzBdLmxlbmd0aCkgOiBjb250ZW50O1xuICAgIGNvbnN0IG5ld0JvZHkgPSBhcHBseUltYWdlTGluZShleGlzdGluZ0JvZHksIGltYWdlTGluZSk7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZ0ZpbGUsIGZyb250bWF0dGVyICsgXCJcXG5cIiArIG5ld0JvZHkpO1xuICAgIHJldHVybiB7IGZpbGU6IGV4aXN0aW5nRmlsZSwgbm90ZVBhdGg6IGV4aXN0aW5nRmlsZS5wYXRoIH07XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYm9keSA9IGltYWdlTGluZSA/IGltYWdlTGluZSArIFwiXFxuXCIgOiBcIlwiO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKG5vdGVQYXRoLCBmcm9udG1hdHRlciArIFwiXFxuXCIgKyBib2R5KTtcbiAgICByZXR1cm4geyBmaWxlLCBub3RlUGF0aCB9O1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUF1Qjs7O0FDQXZCLHNCQUFxRTs7O0FDRXJFLElBQU0sbUJBQW1CO0FBQUEsRUFDdkIsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUNoQjtBQW9DQSxJQUFNLFdBQVc7QUFFakIsZUFBZSxZQUFZLE9BQXdDO0FBM0NuRTtBQTRDRSxRQUFNLE1BQU0sR0FBRyxRQUFRLG1CQUFtQixtQkFBbUIsS0FBSyxDQUFDO0FBQ25FLFVBQVEsSUFBSSx3QkFBd0IsR0FBRztBQUN2QyxNQUFJO0FBQ0YsVUFBTSxNQUFNLE1BQU0sTUFBTSxLQUFLLEVBQUUsU0FBUyxpQkFBaUIsQ0FBQztBQUMxRCxZQUFRLElBQUksK0JBQStCLElBQUksTUFBTTtBQUNyRCxRQUFJLENBQUMsSUFBSSxJQUFJO0FBQ1gsY0FBUSxLQUFLLCtCQUErQixJQUFJLFFBQVEsSUFBSSxVQUFVO0FBQ3RFLGFBQU8sQ0FBQztBQUFBLElBQ1Y7QUFDQSxVQUFNLE9BQU8sTUFBTSxJQUFJLEtBQUs7QUFDNUIsWUFBTyxVQUFLLFNBQUwsWUFBYSxDQUFDO0FBQUEsRUFDdkIsU0FBUyxHQUFHO0FBQ1YsWUFBUSxLQUFLLGlDQUFpQyxDQUFDO0FBQy9DLFdBQU8sQ0FBQztBQUFBLEVBQ1Y7QUFDRjtBQU1BLGVBQXNCLGFBQ3BC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LE1BQ0EsS0FBSyxPQUFPO0FBQUEsTUFDWixLQUFLO0FBQUEsSUFDUDtBQUVBLFVBQU0sV0FBVyxTQUFTLFFBQVEsU0FBUyxFQUFFLEVBQUUsUUFBUSxTQUFTLEVBQUU7QUFDbEUsUUFBSSxhQUFhLEtBQUssUUFBUTtBQUU5QixRQUFJLEtBQUssT0FBTyxTQUFTLG1CQUFtQjtBQUMxQyxVQUFJLEtBQUssT0FBTyxTQUFTLG1CQUFtQjtBQUMxQyxjQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUU7QUFDMUIsc0JBQWM7QUFBQSxLQUFRLE9BQU87QUFBQSxNQUMvQixPQUFPO0FBQ0wsY0FBTSxNQUFNLGdCQUFnQixJQUFJO0FBQ2hDLFlBQUksSUFBSyxlQUFjO0FBQUEsSUFBTyxLQUFLLElBQUksS0FBSyxHQUFHO0FBQUEsTUFDakQ7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFFBQVE7QUFDZixXQUFLLE9BQU8saUJBQWlCLFVBQVU7QUFBQSxJQUN6QyxPQUFPO0FBQ0wsVUFBSSx3QkFBTyxzQkFBc0IsUUFBUSxFQUFFO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQUEsRUFFUSx1QkFBdUIsU0FBd0I7QUFDckQsUUFBSSxTQUFTO0FBQ1gsV0FBSyxRQUFRLFNBQVMsa0JBQWtCO0FBQUEsSUFDMUMsT0FBTztBQUNMLFdBQUssUUFBUSxZQUFZLGtCQUFrQjtBQUFBLElBQzdDO0FBQUEsRUFDRjtBQUNGOzs7QUgvSEEsSUFBcUIsaUJBQXJCLGNBQTRDLHdCQUFPO0FBQUEsRUFHakQsTUFBTSxTQUFTO0FBQ2IsWUFBUSxJQUFJLG1CQUFtQjtBQUMvQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUN6RSxZQUFRLElBQUksOEJBQThCLEtBQUssUUFBUTtBQUV2RCxTQUFLLGNBQWMsSUFBSSxtQkFBbUIsS0FBSyxLQUFLLElBQUksQ0FBQztBQUV6RCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTTtBQWpCdEI7QUFrQlEsZ0JBQVEsSUFBSSx5Q0FBeUM7QUFDckQsY0FBTSxVQUFTLGdCQUFLLElBQUksVUFBVSxpQkFBbkIsbUJBQWlDLFdBQWpDLFlBQTJDO0FBQzFELFlBQUksb0JBQW9CLEtBQUssS0FBSyxNQUFNLE1BQU0sRUFBRSxLQUFLO0FBQUEsTUFDdkQ7QUFBQSxJQUNGLENBQUM7QUFFRCxZQUFRLElBQUkseUJBQXlCO0FBQUEsRUFDdkM7QUFBQSxFQUVBLE1BQU0sV0FBVztBQUFBLEVBQUM7QUFDcEI7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
