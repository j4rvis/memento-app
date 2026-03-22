import { App, Editor, Notice, SuggestModal } from "obsidian";
import { ScryfallCard, searchByName, getCardImageUrl, getCardSmallImageUrl } from "./scryfall";
import { upsertCardNote } from "./note-writer";
import type ScryfallPlugin from "./main";

const SYMBOL_BASE = "https://svgs.scryfall.io/card-symbols/";

function renderManaCost(container: HTMLElement, manaCost: string): void {
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

export class ScryfallSearchModal extends SuggestModal<ScryfallCard> {
  private plugin: ScryfallPlugin;
  private editor: Editor | null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingResolve: ((cards: ScryfallCard[]) => void) | null = null;
  private foundViaGerman = false;

  constructor(app: App, plugin: ScryfallPlugin, editor: Editor | null) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.setPlaceholder("Search for a Magic card…");
    console.log("[Scryfall] modal constructed");
  }

  async getSuggestions(query: string): Promise<ScryfallCard[]> {
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

  renderSuggestion(card: ScryfallCard, el: HTMLElement): void {
    el.addClass("scryfall-suggestion");
    const excluded = this.plugin.settings.excludedSets.includes(card.set);
    const smallUrl = excluded ? undefined : getCardSmallImageUrl(card);

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
    if (card.lang !== "en") setRow.appendText(` · ${card.lang.toUpperCase()}`);
  }

  async onChooseSuggestion(card: ScryfallCard): Promise<void> {
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
        insertText += `\n![[${imgName}]]`;
      } else {
        const url = getCardImageUrl(card);
        if (url) insertText += `\n![${card.name}](${url})`;
      }
    }

    if (this.editor) {
      this.editor.replaceSelection(insertText);
    } else {
      new Notice(`Card note created: ${noteName}`);
    }
  }

  private updateLoadingIndicator(loading: boolean): void {
    if (loading) {
      this.inputEl.addClass("scryfall-loading");
    } else {
      this.inputEl.removeClass("scryfall-loading");
    }
  }
}
