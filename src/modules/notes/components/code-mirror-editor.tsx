"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import { wikiLinkPlugin, wikiLinkCompletion } from "./wiki-link-extension";

// ── Markdown visual style: headings big, bold=bold, italic=italic, etc ──────

const markdownStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.6em", fontWeight: "700", lineHeight: "1.3" },
  { tag: tags.heading2, fontSize: "1.35em", fontWeight: "700", lineHeight: "1.3" },
  { tag: tags.heading3, fontSize: "1.15em", fontWeight: "600" },
  { tag: tags.heading4, fontWeight: "600" },
  { tag: tags.heading5, fontWeight: "600" },
  { tag: tags.heading6, fontWeight: "600" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.monospace, fontFamily: "monospace", fontSize: "0.9em" },
  { tag: tags.link, color: "oklch(0.6 0.15 250)", textDecoration: "underline" },
  { tag: tags.url, color: "oklch(0.55 0.12 250)" },
  { tag: tags.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: tags.comment, color: "var(--muted-foreground)" },
]);

// ── Base theme: layout, colors, wiki-link pill, autocomplete popup ───────────

const appTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflowY: "auto",
    padding: "0 1rem 1rem",
  },
  ".cm-content": {
    caretColor: "var(--foreground)",
    lineHeight: "1.7",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-selectionBackground, .cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--accent)",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
  // Hide the heading markers (#) but keep them for editing (they remain in doc)
  // Wiki-link pill style
  ".cm-wiki-link": {
    color: "oklch(0.55 0.18 250)",
    cursor: "pointer",
    borderBottom: "1px solid oklch(0.55 0.18 250)",
  },
  ".cm-wiki-link:hover": { opacity: "0.75" },
  // Autocomplete popup
  ".cm-tooltip-autocomplete": {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--popover-foreground)",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-tooltip-autocomplete > ul > li": {
    padding: "4px 10px",
  },
});

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderText?: string;
  notes: Array<{ id: string; title: string }>;
  onNavigateToNote: (title: string) => void;
}

export function CodeMirrorEditor({
  value,
  onChange,
  placeholderText = "Write your note...",
  notes,
  onNavigateToNote,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onNavigateRef = useRef(onNavigateToNote);
  const notesRef = useRef(notes);

  onChangeRef.current = onChange;
  onNavigateRef.current = onNavigateToNote;
  notesRef.current = notes;

  const getNotesCallback = useCallback(() => notesRef.current, []);
  const navigateCallback = useCallback((title: string) => onNavigateRef.current(title), []);

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(markdownStyle),
        closeBrackets(),
        placeholder(placeholderText),
        appTheme,
        wikiLinkPlugin(navigateCallback),
        wikiLinkCompletion(getNotesCallback),
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g., switching notes)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} className="flex-1 overflow-hidden h-full" />;
}
