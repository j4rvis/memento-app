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
  default: () => MementoPlugin,
  handleApiError: () => handleApiError,
  showNotice: () => showNotice
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/api.ts
var import_obsidian = require("obsidian");
var MementoApiError = class extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "MementoApiError";
  }
};
var NetworkError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
};
function safeParseJson(response) {
  try {
    return response.json;
  } catch (e) {
    return null;
  }
}
var MementoApiClient = class {
  constructor(apiUrl, clientId, clientSecret) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.cachedToken = null;
  }
  async authenticate() {
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: `${this.apiUrl}/api/auth/token`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        throw: false
      });
      if (response.status === 401) {
        throw new MementoApiError(401, "INVALID_CREDENTIALS", "Invalid client credentials");
      }
      if (response.status !== 200) {
        throw new MementoApiError(
          response.status,
          "AUTH_ERROR",
          `Authentication failed (${response.status})`
        );
      }
      this.cachedToken = response.json.data.access_token;
    } catch (err) {
      if (err instanceof MementoApiError) throw err;
      throw new NetworkError("Network error during authentication");
    }
  }
  /** Test credentials without caching the resulting token. */
  async testConnection() {
    var _a, _b, _c, _d;
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: `${this.apiUrl}/api/auth/token`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        throw: false
      });
      if (response.status === 200) {
        return { ok: true };
      }
      const errorBody = safeParseJson(response);
      return {
        ok: false,
        status: response.status,
        code: (_b = (_a = errorBody == null ? void 0 : errorBody.error) == null ? void 0 : _a.code) != null ? _b : "UNKNOWN_ERROR",
        message: (_d = (_c = errorBody == null ? void 0 : errorBody.error) == null ? void 0 : _c.message) != null ? _d : `Server error (${response.status})`
      };
    } catch (e) {
      return { ok: false, status: 0, code: "NETWORK_ERROR", message: "Network error \u2014 check your API URL" };
    }
  }
  async request(method, path, body, isRetry = false) {
    var _a, _b, _c, _d;
    if (!this.cachedToken) {
      await this.authenticate();
    }
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: `${this.apiUrl}${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cachedToken}`
        },
        body: body !== void 0 ? JSON.stringify(body) : void 0,
        throw: false
      });
      if (response.status === 401 && !isRetry) {
        this.cachedToken = null;
        await this.authenticate();
        return this.request(method, path, body, true);
      }
      if (response.status < 200 || response.status >= 300) {
        const errorBody = safeParseJson(response);
        const code = (_b = (_a = errorBody == null ? void 0 : errorBody.error) == null ? void 0 : _a.code) != null ? _b : "UNKNOWN_ERROR";
        const message = (_d = (_c = errorBody == null ? void 0 : errorBody.error) == null ? void 0 : _c.message) != null ? _d : `Server error (${response.status})`;
        throw new MementoApiError(response.status, code, message);
      }
      return response.json;
    } catch (err) {
      if (err instanceof MementoApiError) throw err;
      throw new NetworkError("Network error \u2014 check your API URL in settings");
    }
  }
  async createBookmark(data) {
    const body = { url: data.url };
    if (data.title) body.title = data.title;
    if (data.content) body.content = data.content;
    if (data.excerpt) body.excerpt = data.excerpt;
    await this.request("POST", "/api/v1/bookmarks", body);
  }
  async createTodo(title, dueDate) {
    const body = { title };
    if (dueDate) body.due_date = dueDate;
    await this.request("POST", "/api/v1/todos", body);
  }
  async generateNewspaper(templateId) {
    await this.request(
      "POST",
      "/api/v1/newspaper/generate?format=json",
      { template_id: templateId }
    );
  }
};

// src/modals.ts
var import_obsidian2 = require("obsidian");
var BookmarkModal = class extends import_obsidian2.Modal {
  constructor(app, prefillUrl, noteData, onSubmit) {
    super(app);
    this.prefillUrl = prefillUrl;
    this.noteData = noteData;
    this.mode = noteData ? "note" : "url";
    this.url = prefillUrl;
    this.urlTitle = "";
    this.onSubmit = onSubmit;
  }
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Save bookmark" });
    if (this.noteData && (this.prefillUrl || true)) {
      const toggleSetting = new import_obsidian2.Setting(contentEl).setName("Source");
      toggleSetting.addDropdown((dd) => {
        dd.addOption("note", "Current note");
        dd.addOption("url", "URL");
        dd.setValue(this.mode);
        dd.onChange((value) => {
          this.mode = value;
          this.render();
        });
      });
    }
    if (this.mode === "note" && this.noteData) {
      this.renderNoteMode(this.noteData);
    } else {
      this.renderUrlMode();
    }
  }
  renderNoteMode(note) {
    const { contentEl } = this;
    new import_obsidian2.Setting(contentEl).setName("Title").setDesc("Resolved from frontmatter or filename").addText((text) => {
      text.setValue(note.title);
      text.inputEl.style.width = "100%";
      text.inputEl.disabled = true;
    });
    if (note.excerpt) {
      const excerptEl = contentEl.createEl("p");
      excerptEl.style.color = "var(--text-muted)";
      excerptEl.style.fontSize = "0.85em";
      excerptEl.style.marginBottom = "1em";
      excerptEl.textContent = note.excerpt;
    }
    new import_obsidian2.Setting(contentEl).addButton((btn) => {
      btn.setButtonText("Save note as bookmark").setCta().onClick(() => {
        this.close();
        this.onSubmit({
          url: note.url,
          title: note.title,
          content: note.content,
          excerpt: note.excerpt || void 0
        }).catch(handleApiError);
      });
    });
  }
  renderUrlMode() {
    const { contentEl } = this;
    const errorEl = contentEl.createEl("p", { cls: "memento-error" });
    errorEl.style.color = "var(--color-red)";
    errorEl.style.display = "none";
    new import_obsidian2.Setting(contentEl).setName("URL").addText((text) => {
      text.setValue(this.url).onChange((value) => {
        this.url = value.trim();
      });
      text.inputEl.style.width = "100%";
    });
    new import_obsidian2.Setting(contentEl).setName("Title").setDesc("Optional \u2014 leave blank to auto-detect").addText((text) => {
      text.setPlaceholder("Title (optional)").onChange((value) => {
        this.urlTitle = value.trim();
      });
      text.inputEl.style.width = "100%";
    });
    new import_obsidian2.Setting(contentEl).addButton((btn) => {
      btn.setButtonText("Save").setCta().onClick(() => {
        if (!this.url) {
          errorEl.textContent = "URL is required";
          errorEl.style.display = "block";
          return;
        }
        this.close();
        this.onSubmit({ url: this.url, title: this.urlTitle || void 0 }).catch(handleApiError);
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var TodoModal = class extends import_obsidian2.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.title = "";
    this.dueDate = "";
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create todo" });
    const errorEl = contentEl.createEl("p", { cls: "memento-error" });
    errorEl.style.color = "var(--color-red)";
    errorEl.style.display = "none";
    new import_obsidian2.Setting(contentEl).setName("Title").addText((text) => {
      text.setPlaceholder("What needs to be done?").onChange((value) => {
        this.title = value.trim();
      });
      text.inputEl.style.width = "100%";
    });
    new import_obsidian2.Setting(contentEl).setName("Due date").setDesc("Optional \u2014 YYYY-MM-DD format").addText((text) => {
      text.setPlaceholder("2026-01-15").onChange((value) => {
        this.dueDate = value.trim();
      });
    });
    new import_obsidian2.Setting(contentEl).addButton((btn) => {
      btn.setButtonText("Create").setCta().onClick(() => {
        if (!this.title) {
          errorEl.textContent = "Title is required";
          errorEl.style.display = "block";
          return;
        }
        this.close();
        this.onSubmit(this.title, this.dueDate || void 0);
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/notes.ts
async function getNoteBookmarkData(app) {
  var _a;
  const file = app.workspace.getActiveFile();
  if (!file) return null;
  const content = await app.vault.read(file);
  const vaultName = app.vault.getName();
  const url = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file.path)}`;
  const title = (_a = resolveTitleFromContent(content)) != null ? _a : file.basename;
  const excerpt = extractExcerpt(content);
  return { url, title, content, excerpt };
}
function resolveTitleFromContent(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const titleMatch = fmMatch[1].match(/^title:\s*(.+)$/m);
  return titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, "") : null;
}
function extractExcerpt(content) {
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("```")) continue;
    return trimmed.length > 300 ? trimmed.slice(0, 297) + "\u2026" : trimmed;
  }
  return "";
}

// src/main.ts
var DEFAULT_SETTINGS = {
  apiUrl: "",
  clientId: "",
  clientSecret: "",
  templateId: ""
};
var MementoPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.apiClient = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MementoSettingTab(this.app, this));
    this.addCommand({
      id: "save-bookmark",
      name: "Save bookmark",
      callback: () => this.saveBookmarkCommand()
    });
    this.addCommand({
      id: "create-todo",
      name: "Create todo",
      callback: () => this.createTodoCommand()
    });
    this.addCommand({
      id: "generate-newspaper",
      name: "Generate newspaper",
      callback: () => this.generateNewspaperCommand()
    });
  }
  getApiClient() {
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
  validateSettings() {
    if (!this.settings.apiUrl || !this.settings.clientId || !this.settings.clientSecret) {
      showNotice("Configure API URL, Client ID, and Client Secret in settings");
      return false;
    }
    return true;
  }
  async saveBookmarkCommand() {
    if (!this.validateSettings()) return;
    let prefillUrl = "";
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("http://") || text.startsWith("https://")) {
        prefillUrl = text;
      }
    } catch (e) {
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
  async createTodoCommand() {
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
  async generateNewspaperCommand() {
    if (!this.validateSettings()) return;
    if (!this.settings.templateId) {
      showNotice("No template configured \u2014 set a Template ID in settings");
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
};
function showNotice(message, durationMs = 5e3) {
  new import_obsidian3.Notice(`Memento: ${message}`, durationMs);
}
function showErrorNotice(message) {
  showNotice(message, 8e3);
}
function handleApiError(err) {
  if (err instanceof MementoApiError) {
    if (err.statusCode === 409) {
      showErrorNotice("This URL is already bookmarked");
    } else {
      showErrorNotice(`${err.message} [HTTP ${err.statusCode} \xB7 ${err.code}]`);
    }
  } else if (err instanceof NetworkError) {
    showErrorNotice("Network error \u2014 check your API URL in settings");
  } else {
    showErrorNotice("An unexpected error occurred");
  }
}
var MementoSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian3.Setting(containerEl).setName("API URL").setDesc("Base URL of your Memento instance (e.g. https://memento.example.com)").addText(
      (text) => text.setPlaceholder("https://memento.example.com").setValue(this.plugin.settings.apiUrl).onChange(async (value) => {
        this.plugin.settings.apiUrl = value.trim();
        this.plugin.invalidateApiClient();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Client ID").setDesc("API client ID (starts with mc_)").addText(
      (text) => text.setPlaceholder("mc_...").setValue(this.plugin.settings.clientId).onChange(async (value) => {
        this.plugin.settings.clientId = value.trim();
        this.plugin.invalidateApiClient();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Client Secret").setDesc("API client secret \u2014 stored locally in your vault").addText((text) => {
      text.setPlaceholder("Client secret").setValue(this.plugin.settings.clientSecret).onChange(async (value) => {
        this.plugin.settings.clientSecret = value.trim();
        this.plugin.invalidateApiClient();
        await this.plugin.saveSettings();
      });
      text.inputEl.type = "password";
    });
    new import_obsidian3.Setting(containerEl).setName("Newspaper Template ID").setDesc("UUID of the newspaper template to use when generating").addText(
      (text) => text.setPlaceholder("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").setValue(this.plugin.settings.templateId).onChange(async (value) => {
        this.plugin.settings.templateId = value.trim();
        await this.plugin.saveSettings();
      })
    );
    const resultEl = containerEl.createEl("p");
    resultEl.style.fontSize = "0.85em";
    resultEl.style.marginTop = "0.25em";
    resultEl.style.display = "none";
    new import_obsidian3.Setting(containerEl).setName("Test connection").setDesc("Verify that your API URL and credentials are working").addButton((btn) => {
      btn.setButtonText("Test connection").onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText("Testing\u2026");
        resultEl.style.display = "none";
        const client = new MementoApiClient(
          this.plugin.settings.apiUrl,
          this.plugin.settings.clientId,
          this.plugin.settings.clientSecret
        );
        const result = await client.testConnection();
        if (result.ok) {
          resultEl.textContent = "\u2713 Connected successfully";
          resultEl.style.color = "var(--color-green)";
        } else if (result.code === "NETWORK_ERROR") {
          resultEl.textContent = "\u2717 Network error \u2014 check your API URL";
          resultEl.style.color = "var(--color-red)";
        } else {
          resultEl.textContent = `\u2717 Authentication failed [HTTP ${result.status} \xB7 ${result.code}]`;
          resultEl.style.color = "var(--color-red)";
        }
        resultEl.style.display = "block";
        btn.setDisabled(false);
        btn.setButtonText("Test connection");
      });
    });
  }
};
