"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { wikiLinkPlugin, wikiLinkCompletion } from "./wiki-link-extension";

// ── App-aware theme using CSS variables ─────────────────────────────────────

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
  ".cm-wiki-link": {
    color: "oklch(0.6 0.15 250)",
    cursor: "pointer",
    borderBottom: "1px solid oklch(0.6 0.15 250)",
  },
  ".cm-wiki-link:hover": { opacity: "0.75" },
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

  // Keep refs current without recreating editor
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
