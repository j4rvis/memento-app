import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, Extension } from "@codemirror/state";
import { CompletionContext, CompletionResult, CompletionSource } from "@codemirror/autocomplete";

// ── Resource types ────────────────────────────────────────────────────────────

export type WikiLinkResourceType = "note" | "todo" | "article" | "feed";

export interface WikiLinkResource {
  type: WikiLinkResourceType;
  id: string;
  title: string;
}

// Maps type prefix used in link text to resource type
const TYPE_PREFIXES: Record<string, WikiLinkResourceType> = {
  "todo:": "todo",
  "article:": "article",
  "feed:": "feed",
  "note:": "note",
};

// Labels shown in autocomplete detail column
const TYPE_LABELS: Record<WikiLinkResourceType, string> = {
  note: "Note",
  todo: "Todo",
  article: "Article",
  feed: "Feed",
};

/** Parse [[raw]] content into type + title */
function parseWikiContent(raw: string): { type: WikiLinkResourceType; title: string } {
  for (const [prefix, type] of Object.entries(TYPE_PREFIXES)) {
    if (raw.startsWith(prefix)) {
      return { type, title: raw.slice(prefix.length) };
    }
  }
  return { type: "note", title: raw };
}

/** Format a resource into the text that goes inside [[...]] */
function formatLinkContent(resource: WikiLinkResource): string {
  if (resource.type === "note") return resource.title;
  return `${resource.type}:${resource.title}`;
}

// ── Widget rendered for [[Link]] spans ──────────────────────────────────────

class WikiLinkWidget extends WidgetType {
  readonly parsed: { type: WikiLinkResourceType; title: string };

  constructor(
    readonly rawContent: string,
    readonly onNavigate: (type: WikiLinkResourceType, title: string) => void
  ) {
    super();
    this.parsed = parseWikiContent(rawContent);
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `cm-wiki-link cm-wiki-link-${this.parsed.type}`;
    span.textContent = `[[${this.parsed.title}]]`;
    span.title = `${TYPE_LABELS[this.parsed.type]}: ${this.parsed.title}`;
    span.addEventListener("click", () => this.onNavigate(this.parsed.type, this.parsed.title));
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

// ── Decoration plugin ────────────────────────────────────────────────────────

function wikiLinkDecorations(
  view: EditorView,
  onNavigate: (type: WikiLinkResourceType, title: string) => void
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Match [[...]] links (content may include type prefixes like "todo:")
  const pattern = /\[\[([^\[\]]+?)\]\]/g;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(line.text)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;

      // If cursor is inside this span, show raw text for editing
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

export function wikiLinkPlugin(
  onNavigate: (type: WikiLinkResourceType, title: string) => void
): Extension {
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

// ── Completion source for [[ (exported separately so caller controls autocompletion()) ──

export function wikiLinkCompletionSource(getResources: () => WikiLinkResource[]): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    // Match [[ followed by anything that isn't a closing ]
    const match = context.matchBefore(/\[\[([^\]]*)/);
    if (!match) return null;

    const text = match.text.slice(2); // strip [[
    const resources = getResources();

    // Detect type prefix (e.g. "todo:", "article:")
    let candidates = resources;
    let queryText = text.toLowerCase();

    for (const [prefix, type] of Object.entries(TYPE_PREFIXES)) {
      if (text.toLowerCase().startsWith(prefix)) {
        candidates = resources.filter((r) => r.type === type);
        queryText = text.slice(prefix.length).toLowerCase();
        break;
      }
    }

    const options = candidates
      .filter((r) => r.title.toLowerCase().includes(queryText))
      .slice(0, 15)
      .map((r) => {
        const linkContent = formatLinkContent(r);
        return {
          label: r.title,
          detail: TYPE_LABELS[r.type],
          apply: (view: EditorView, _: unknown, from: number, to: number) => {
            // closeBrackets may have auto-inserted ] chars after cursor; consume them
            let adjustedTo = to;
            const docLen = view.state.doc.length;
            while (adjustedTo < docLen) {
              const ch = view.state.doc.sliceString(adjustedTo, adjustedTo + 1);
              if (ch === "]") adjustedTo += 1;
              else break;
            }
            const insert = `[[${linkContent}]]`;
            view.dispatch({
              changes: { from, to: adjustedTo, insert },
              selection: { anchor: from + insert.length },
            });
          },
        };
      });

    if (options.length === 0) return null;

    // filter: false because CM6 would use "[[query" as the match pattern (including the brackets),
    // causing all options to be filtered out. We do our own filtering above.
    return { from: match.from, options, filter: false, validFor: /^[^\]]*$/ };
  };
}
