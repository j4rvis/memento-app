import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { MementoApiClient, MementoApiError, NetworkError, TestConnectionResult, TestConnectionFailure } from "./api";
import { BookmarkModal, TodoModal } from "./modals";
import { getNoteBookmarkData } from "./notes";

export interface MementoSettings {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  templateId: string;
}

const DEFAULT_SETTINGS: MementoSettings = {
  apiUrl: "",
  clientId: "",
  clientSecret: "",
  templateId: "",
};

export default class MementoPlugin extends Plugin {
  settings!: MementoSettings;
  private apiClient: MementoApiClient | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MementoSettingTab(this.app, this));

    this.addCommand({
      id: "save-bookmark",
      name: "Save bookmark",
      callback: () => this.saveBookmarkCommand(),
    });

    this.addCommand({
      id: "create-todo",
      name: "Create todo",
      callback: () => this.createTodoCommand(),
    });

    this.addCommand({
      id: "generate-newspaper",
      name: "Generate newspaper",
      callback: () => this.generateNewspaperCommand(),
    });
  }

  getApiClient(): MementoApiClient {
    if (!this.apiClient) {
      this.apiClient = new MementoApiClient(
        this.settings.apiUrl,
        this.settings.clientId,
        this.settings.clientSecret
      );
    }
    return this.apiClient;
  }

  invalidateApiClient() {
    this.apiClient = null;
  }

  private validateSettings(): boolean {
    if (!this.settings.apiUrl || !this.settings.clientId || !this.settings.clientSecret) {
      showNotice("Configure API URL, Client ID, and Client Secret in settings");
      return false;
    }
    return true;
  }

  private async saveBookmarkCommand() {
    if (!this.validateSettings()) return;

    let prefillUrl = "";
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("http://") || text.startsWith("https://")) {
        prefillUrl = text;
      }
    } catch {
      // Clipboard access failed — start with empty field
    }

    const noteData = await getNoteBookmarkData(this.app);

    new BookmarkModal(this.app, prefillUrl, noteData, async (data) => {
      try {
        await this.getApiClient().createBookmark(data);
        showNotice("Bookmark saved");
      } catch (err) {
        handleApiError(err);
      }
    }).open();
  }

  private async createTodoCommand() {
    if (!this.validateSettings()) return;

    new TodoModal(this.app, async (title, dueDate) => {
      try {
        await this.getApiClient().createTodo(title, dueDate);
        showNotice("Todo created");
      } catch (err) {
        handleApiError(err);
      }
    }).open();
  }

  private async generateNewspaperCommand() {
    if (!this.validateSettings()) return;

    if (!this.settings.templateId) {
      showNotice("No template configured — set a Template ID in settings");
      return;
    }

    try {
      await this.getApiClient().generateNewspaper(this.settings.templateId);
      showNotice("Newspaper generation started");
    } catch (err) {
      handleApiError(err);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

export function showNotice(message: string, durationMs = 5000) {
  new Notice(`Memento: ${message}`, durationMs);
}

function showErrorNotice(message: string) {
  showNotice(message, 8000);
}

export function handleApiError(err: unknown) {
  if (err instanceof MementoApiError) {
    if (err.statusCode === 409) {
      showErrorNotice("This URL is already bookmarked");
    } else {
      showErrorNotice(`${err.message} [HTTP ${err.statusCode} · ${err.code}]`);
    }
  } else if (err instanceof NetworkError) {
    showErrorNotice("Network error — check your API URL in settings");
  } else {
    showErrorNotice("An unexpected error occurred");
  }
}

class MementoSettingTab extends PluginSettingTab {
  plugin: MementoPlugin;

  constructor(app: App, plugin: MementoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API URL")
      .setDesc("Base URL of your Memento instance (e.g. https://memento.example.com)")
      .addText((text) =>
        text
          .setPlaceholder("https://memento.example.com")
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiUrl = value.trim();
            this.plugin.invalidateApiClient();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Client ID")
      .setDesc("API client ID (starts with mc_)")
      .addText((text) =>
        text
          .setPlaceholder("mc_...")
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value.trim();
            this.plugin.invalidateApiClient();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Client Secret")
      .setDesc("API client secret — stored locally in your vault")
      .addText((text) => {
        text
          .setPlaceholder("Client secret")
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.clientSecret = value.trim();
            this.plugin.invalidateApiClient();
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });

    new Setting(containerEl)
      .setName("Newspaper Template ID")
      .setDesc("UUID of the newspaper template to use when generating")
      .addText((text) =>
        text
          .setPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
          .setValue(this.plugin.settings.templateId)
          .onChange(async (value) => {
            this.plugin.settings.templateId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    const resultEl = containerEl.createEl("p");
    resultEl.style.fontSize = "0.85em";
    resultEl.style.marginTop = "0.25em";
    resultEl.style.display = "none";

    new Setting(containerEl)
      .setName("Test connection")
      .setDesc("Verify that your API URL and credentials are working")
      .addButton((btn) => {
        btn.setButtonText("Test connection").onClick(async () => {
          btn.setDisabled(true);
          btn.setButtonText("Testing…");
          resultEl.style.display = "none";

          const client = new MementoApiClient(
            this.plugin.settings.apiUrl,
            this.plugin.settings.clientId,
            this.plugin.settings.clientSecret
          );
          const result: TestConnectionResult | TestConnectionFailure = await client.testConnection();

          if (result.ok) {
            resultEl.textContent = "✓ Connected successfully";
            resultEl.style.color = "var(--color-green)";
          } else if (result.code === "NETWORK_ERROR") {
            resultEl.textContent = "✗ Network error — check your API URL";
            resultEl.style.color = "var(--color-red)";
          } else {
            resultEl.textContent = `✗ Authentication failed [HTTP ${result.status} · ${result.code}]`;
            resultEl.style.color = "var(--color-red)";
          }

          resultEl.style.display = "block";
          btn.setDisabled(false);
          btn.setButtonText("Test connection");
        });
      });
  }
}
