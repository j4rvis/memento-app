import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, Extension } from "@codemirror/state";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";

// ── Widget rendered for [[Link]] spans ──────────────────────────────────────

class WikiLinkWidget extends WidgetType {
  constructor(readonly title: string, readonly onClick: (title: string) => void) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-wiki-link";
    span.textContent = `[[${this.title}]]`;
    span.addEventListener("click", () => this.onClick(this.title));
    return span;
  }

  ignoreEvent(event: Event) {
    return event.type === "click";
  }
}

// ── Decoration plugin ────────────────────────────────────────────────────────

function wikiLinkDecorations(
  view: EditorView,
  onNavigate: (title: string) => void
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Only decorate completed [[...]] links (not currently being typed)
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const pattern = /\[\[([^\[\]]+?)\]\]/g;
    let match;
    while ((match = pattern.exec(line.text)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;

      // Check if the cursor is inside this span; if so, let raw text show
      const cursor = view.state.selection.main.head;
      if (cursor >= from && cursor <= to) continue;

      builder.add(
        from,
        to,
        Decoration.replace({
          widget: new WikiLinkWidget(match[1], onNavigate),
        })
      );
    }
  }

  return builder.finish();
}

export function wikiLinkPlugin(onNavigate: (title: string) => void): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = wikiLinkDecorations(view, onNavigate);
      }
      update(update: { view: EditorView; docChanged: boolean; selectionSet: boolean }) {
        if (update.docChanged || update.selectionSet) {
          this.decorations = wikiLinkDecorations(update.view, onNavigate);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}

// ── Autocomplete for [[ ──────────────────────────────────────────────────────

export function wikiLinkCompletion(getNotes: () => Array<{ id: string; title: string }>) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        // Match [[<partial> (no closing ]])
        const match = context.matchBefore(/\[\[([^\]]*)/);
        if (!match) return null;

        const query = match.text.slice(2).toLowerCase(); // strip [[
        const notes = getNotes();
        const options = notes
          .filter((n) => n.title.toLowerCase().includes(query))
          .slice(0, 10)
          .map((n) => ({
            label: n.title,
            apply: (view: EditorView, _: unknown, from: number, to: number) => {
              // `from` equals match.from which is the position of `[[`
              view.dispatch({
                changes: { from, to, insert: `[[${n.title}]]` },
                selection: { anchor: from + n.title.length + 4 },
              });
            },
          }));

        if (options.length === 0) return null;

        return {
          from: match.from,
          options,
          validFor: /^[^\]]*$/,
        };
      },
    ],
  });
}
