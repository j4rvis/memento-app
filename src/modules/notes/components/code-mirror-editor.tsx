"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder, tooltips } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import { wikiLinkPlugin, wikiLinkCompletionSource } from "./wiki-link-extension";
import type { WikiLinkResource, WikiLinkResourceType } from "./wiki-link-extension";

export type { WikiLinkResource, WikiLinkResourceType };

// ── Markdown visual style ─────────────────────────────────────────────────────

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
  { tag: tags.link, color: "oklch(0.50 0.1 145)", textDecoration: "underline" },
  { tag: tags.url, color: "oklch(0.50 0.1 145)" },
  { tag: tags.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: tags.comment, color: "var(--muted-foreground)" },
]);

// ── Base theme ────────────────────────────────────────────────────────────────

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
    backgroundColor: "oklch(0.50 0.1 145 / 30%)",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
  // Wiki-link pill styles
  ".cm-wiki-link": {
    cursor: "pointer",
    borderBottom: "1px solid currentColor",
  },
  ".cm-wiki-link:hover": { opacity: "0.75" },
  ".cm-wiki-link-note": { color: "oklch(0.50 0.1 145)" },
  ".cm-wiki-link-todo": { color: "oklch(0.55 0.15 30)" },
  ".cm-wiki-link-article": { color: "oklch(0.50 0.12 270)" },
  ".cm-wiki-link-feed": { color: "oklch(0.50 0.12 160)" },
});

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderText?: string;
  resources: WikiLinkResource[];
  onNavigate: (type: WikiLinkResourceType, title: string) => void;
}

export function CodeMirrorEditor({
  value,
  onChange,
  placeholderText = "Write your note...",
  resources,
  onNavigate,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onNavigateRef = useRef(onNavigate);
  const resourcesRef = useRef(resources);

  onChangeRef.current = onChange;
  onNavigateRef.current = onNavigate;
  resourcesRef.current = resources;

  const getResourcesCallback = useCallback(() => resourcesRef.current, []);
  const navigateCallback = useCallback(
    (type: WikiLinkResourceType, title: string) => onNavigateRef.current(type, title),
    []
  );

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
        tooltips({ parent: document.body }),
        wikiLinkPlugin(navigateCallback),
        autocompletion({ override: [wikiLinkCompletionSource(getResourcesCallback)] }),
        keymap.of([
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
        ]),
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
