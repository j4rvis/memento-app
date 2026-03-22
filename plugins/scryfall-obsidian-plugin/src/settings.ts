import { App, PluginSettingTab, Setting } from "obsidian";
import type ScryfallPlugin from "./main";

export interface ScryfallSettings {
  targetFolder: string;
  imagesFolder: string;
  languagePreference: "en" | "de";
  saveImagesLocally: boolean;
  insertImageInline: boolean;
}

export const DEFAULT_SETTINGS: ScryfallSettings = {
  targetFolder: "Cards",
  imagesFolder: "Cards/images",
  languagePreference: "en",
  saveImagesLocally: false,
  insertImageInline: false,
};

export class ScryfallSettingTab extends PluginSettingTab {
  plugin: ScryfallPlugin;

  constructor(app: App, plugin: ScryfallPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

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
            this.display(); // re-render to show/hide images folder setting
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
  }
}
