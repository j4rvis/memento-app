import { App, Modal, Setting } from "obsidian";
import { NoteBookmarkData } from "./notes";
import { handleApiError } from "./main";

export interface BookmarkSubmitData {
  url: string;
  title?: string;
  content?: string;
  excerpt?: string;
}

export class BookmarkModal extends Modal {
  private mode: "url" | "note";
  private url: string;
  private urlTitle: string;
  private onSubmit: (data: BookmarkSubmitData) => Promise<void>;

  constructor(
    app: App,
    private prefillUrl: string,
    private noteData: NoteBookmarkData | null,
    onSubmit: (data: BookmarkSubmitData) => Promise<void>
  ) {
    super(app);
    this.mode = noteData ? "note" : "url";
    this.url = prefillUrl;
    this.urlTitle = "";
    this.onSubmit = onSubmit;
  }

  onOpen() {
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Save bookmark" });

    // Mode toggle — only show when both modes are available
    if (this.noteData && (this.prefillUrl || true)) {
      const toggleSetting = new Setting(contentEl).setName("Source");
      toggleSetting.addDropdown((dd) => {
        dd.addOption("note", "Current note");
        dd.addOption("url", "URL");
        dd.setValue(this.mode);
        dd.onChange((value) => {
          this.mode = value as "url" | "note";
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

  private renderNoteMode(note: NoteBookmarkData) {
    const { contentEl } = this;

    new Setting(contentEl)
      .setName("Title")
      .setDesc("Resolved from frontmatter or filename")
      .addText((text) => {
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

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Save note as bookmark")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit({
            url: note.url,
            title: note.title,
            content: note.content,
            excerpt: note.excerpt || undefined,
          }).catch(handleApiError);
        });
    });
  }

  private renderUrlMode() {
    const { contentEl } = this;

    const errorEl = contentEl.createEl("p", { cls: "memento-error" });
    errorEl.style.color = "var(--color-red)";
    errorEl.style.display = "none";

    new Setting(contentEl).setName("URL").addText((text) => {
      text.setValue(this.url).onChange((value) => {
        this.url = value.trim();
      });
      text.inputEl.style.width = "100%";
    });

    new Setting(contentEl)
      .setName("Title")
      .setDesc("Optional — leave blank to auto-detect")
      .addText((text) => {
        text.setPlaceholder("Title (optional)").onChange((value) => {
          this.urlTitle = value.trim();
        });
        text.inputEl.style.width = "100%";
      });

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Save")
        .setCta()
        .onClick(() => {
          if (!this.url) {
            errorEl.textContent = "URL is required";
            errorEl.style.display = "block";
            return;
          }
          this.close();
          this.onSubmit({ url: this.url, title: this.urlTitle || undefined }).catch(handleApiError);
        });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class TodoModal extends Modal {
  private title: string;
  private dueDate: string;
  private onSubmit: (title: string, dueDate?: string) => void;

  constructor(
    app: App,
    onSubmit: (title: string, dueDate?: string) => void
  ) {
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

    new Setting(contentEl).setName("Title").addText((text) => {
      text.setPlaceholder("What needs to be done?").onChange((value) => {
        this.title = value.trim();
      });
      text.inputEl.style.width = "100%";
    });

    new Setting(contentEl)
      .setName("Due date")
      .setDesc("Optional — YYYY-MM-DD format")
      .addText((text) => {
        text.setPlaceholder("2026-01-15").onChange((value) => {
          this.dueDate = value.trim();
        });
      });

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          if (!this.title) {
            errorEl.textContent = "Title is required";
            errorEl.style.display = "block";
            return;
          }
          this.close();
          this.onSubmit(this.title, this.dueDate || undefined);
        });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
