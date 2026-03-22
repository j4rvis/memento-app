import { App, AbstractInputSuggest, PluginSettingTab, Setting } from "obsidian";
import { ScryfallSetInfo, fetchAllSets } from "./scryfall";
import type ScryfallPlugin from "./main";

export interface ScryfallSettings {
  targetFolder: string;
  imagesFolder: string;
  languagePreference: "en" | "de";
  saveImagesLocally: boolean;
  insertImageInline: boolean;
  excludedSets: string[];
}

export const DEFAULT_SETTINGS: ScryfallSettings = {
  targetFolder: "Cards",
  imagesFolder: "Cards/images",
  languagePreference: "en",
  saveImagesLocally: false,
  insertImageInline: false,
  excludedSets: [],
};

const SET_TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: "Expansions & Core Sets", types: ["expansion", "core"] },
  { label: "Masters Sets", types: ["masters"] },
  { label: "Commander & Specialty", types: ["commander", "draft_innovation", "planechase", "archenemy", "vanguard"] },
  { label: "Promo & Extras", types: ["promo", "token", "memorabilia", "minigame"] },
];

function normalizeSetType(set_type: string): string {
  for (const group of SET_TYPE_GROUPS) {
    if (group.types.includes(set_type)) return group.label;
  }
  return "Other";
}

class SetSuggest extends AbstractInputSuggest<ScryfallSetInfo> {
  private getSets: () => ScryfallSetInfo[];
  private onSelect: (set: ScryfallSetInfo) => void;
  private lastRenderedGroup = "";

  constructor(
    app: App,
    inputEl: HTMLInputElement,
    getSets: () => ScryfallSetInfo[],
    onSelect: (set: ScryfallSetInfo) => void
  ) {
    super(app, inputEl);
    this.getSets = getSets;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): ScryfallSetInfo[] {
    const q = query.toLowerCase();
    const filtered = this.getSets()
      .filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));

    // Sort by normalized group so same-type sets appear together
    filtered.sort((a, b) => {
      const ga = normalizeSetType(a.set_type);
      const gb = normalizeSetType(b.set_type);
      if (ga !== gb) return ga.localeCompare(gb);
      return a.name.localeCompare(b.name);
    });

    this.lastRenderedGroup = "";
    return filtered.slice(0, 30);
  }

  renderSuggestion(set: ScryfallSetInfo, el: HTMLElement): void {
    const group = normalizeSetType(set.set_type);
    if (group !== this.lastRenderedGroup) {
      this.lastRenderedGroup = group;
      el.createDiv({ cls: "scryfall-set-group-separator", text: group });
    }
    const row = el.createDiv({ cls: "scryfall-set-row" });
    row.createSpan({ text: set.name });
    row.createSpan({ cls: "scryfall-set-code", text: ` (${set.code})` });
  }

  selectSuggestion(set: ScryfallSetInfo): void {
    this.onSelect(set);
    this.close();
  }
}

export class ScryfallSettingTab extends PluginSettingTab {
  plugin: ScryfallPlugin;
  private allSets: ScryfallSetInfo[] = [];

  constructor(app: App, plugin: ScryfallPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();

    // Fetch sets in the background when tab opens
    if (this.allSets.length === 0) {
      fetchAllSets().then(sets => { this.allSets = sets; });
    }

    containerEl.createEl("h3", { text: "How to use" });
    const howTo = containerEl.createEl("div", { cls: "scryfall-howto" });
    howTo.createEl("p", {
      text: "Open the command palette (Cmd/Ctrl + P) and run \"Scryfall: Insert card\". Type a card name to search — results appear as you type. Selecting a card:",
    });
    const list = howTo.createEl("ol");
    list.createEl("li", { text: "Creates (or updates) a note in the card notes folder with full card data as frontmatter." });
    list.createEl("li", { text: "Inserts a [[wikilink]] to that note at your cursor position." });
    howTo.createEl("p", {
      text: "You can also assign a custom hotkey under Settings → Hotkeys → search \"Scryfall\".",
    });

    containerEl.createEl("h3", { text: "Settings" });

    new Setting(containerEl)
      .setName("Card notes folder")
      .setDesc("Vault folder where card notes are saved.")
      .addText((text) =>
        text
          .setPlaceholder("Cards")
          .setValue(this.plugin.settings.targetFolder)
          .onChange(async (value) => {
            this.plugin.settings.targetFolder = value || "Cards";
            await this.plugin.saveData(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName("Language preference")
      .setDesc("Which language to search first. The other is used as fallback.")
      .addDropdown((drop) =>
        drop
          .addOption("en", "English")
          .addOption("de", "German")
          .setValue(this.plugin.settings.languagePreference)
          .onChange(async (value) => {
            this.plugin.settings.languagePreference = value as "en" | "de";
            await this.plugin.saveData(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName("Save images locally")
      .setDesc(
        "Download card images into the vault (~100 KB per card). When off, only the Scryfall CDN URL is stored."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.saveImagesLocally)
          .onChange(async (value) => {
            this.plugin.settings.saveImagesLocally = value;
            await this.plugin.saveData(this.plugin.settings);
            this.display();
          })
      );

    if (this.plugin.settings.saveImagesLocally) {
      new Setting(containerEl)
        .setName("Images folder")
        .setDesc("Vault folder where card images are downloaded.")
        .addText((text) =>
          text
            .setPlaceholder("Cards/images")
            .setValue(this.plugin.settings.imagesFolder)
            .onChange(async (value) => {
              this.plugin.settings.imagesFolder = value || "Cards/images";
              await this.plugin.saveData(this.plugin.settings);
            })
        );
    }

    new Setting(containerEl)
      .setName("Insert image inline")
      .setDesc("Also insert an image embed below the wikilink when inserting a card.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.insertImageInline)
          .onChange(async (value) => {
            this.plugin.settings.insertImageInline = value;
            await this.plugin.saveData(this.plugin.settings);
          })
      );

    // --- Excluded sets ---
    containerEl.createEl("h3", { text: "Excluded sets" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Cards from excluded sets will not show artwork in the search dropdown or in card notes.",
    });

    const excludedSets = this.plugin.settings.excludedSets;
    if (excludedSets.length > 0) {
      const exclusionList = containerEl.createEl("div", { cls: "scryfall-exclusion-list" });
      for (const code of excludedSets) {
        const row = exclusionList.createEl("div", { cls: "scryfall-exclusion-row" });
        const label = this.allSets.find(s => s.code === code)?.name ?? code;
        row.createSpan({ text: `${label} (${code})` });
        const removeBtn = row.createEl("button", { text: "×", cls: "scryfall-remove-btn" });
        removeBtn.addEventListener("click", async () => {
          this.plugin.settings.excludedSets = this.plugin.settings.excludedSets.filter(c => c !== code);
          await this.plugin.saveData(this.plugin.settings);
          this.display();
        });
      }
    }

    const addSetting = new Setting(containerEl)
      .setName("Add excluded set")
      .setDesc("Type a set name or code to search. ");

    // Append fallback link to the description
    addSetting.descEl.createEl("a", {
      text: "Browse all sets on Scryfall",
      href: "https://scryfall.com/sets",
    });

    addSetting.addText((text) => {
      const inputEl = text.inputEl as HTMLInputElement;
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
      (inputEl as HTMLInputElement & { _scryfallSuggest?: SetSuggest })._scryfallSuggest = suggest;
    });
  }
}
