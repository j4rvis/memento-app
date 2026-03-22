import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, ScryfallSettingTab, ScryfallSettings } from "./settings";
import { ScryfallSearchModal } from "./modal";

export default class ScryfallPlugin extends Plugin {
  settings: ScryfallSettings;

  async onload() {
    console.log("[Scryfall] onload");
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    console.log("[Scryfall] settings loaded", this.settings);

    this.addSettingTab(new ScryfallSettingTab(this.app, this));

    this.addCommand({
      id: "insert-card",
      name: "Insert card",
      callback: () => {
        console.log("[Scryfall] command fired, opening modal");
        const editor = this.app.workspace.activeEditor?.editor ?? null;
        new ScryfallSearchModal(this.app, this, editor).open();
      },
    });

    console.log("[Scryfall] plugin ready");
  }

  async onunload() {}
}
