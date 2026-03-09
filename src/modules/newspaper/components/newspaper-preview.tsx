"use client";

import { WIDGET_REGISTRY } from "@/modules/newspaper/lib/widgets/registry";
import type { EditionBlock } from "@/modules/newspaper/lib/widgets/types";

interface Edition {
  id: string;
  title: string;
  content: EditionBlock[];
  generated_at: string;
}

// Block types that always occupy full width (no column assignment)
const FULL_WIDTH_TYPES = new Set(["header", "image"]);

function splitIntoColumns(blocks: EditionBlock[], n: number): EditionBlock[][] {
  // Assign blocks sequentially: fill column 0 first, then column 1, etc.
  // This is the newspaper convention (read top-to-bottom per column).
  const size = Math.ceil(blocks.length / n);
  return Array.from({ length: n }, (_, i) => blocks.slice(i * size, (i + 1) * size));
}

export function NewspaperPreview({
  edition,
  printConfig = {},
}: {
  edition: Edition;
  printConfig?: Record<string, string>;
}) {
  const colCount = Math.min(3, Math.max(1, Number(printConfig.columns ?? "2")));

  // Group blocks by page_index
  const pageMap = new Map<number, EditionBlock[]>();
  for (const block of edition.content) {
    const pi = block.page_index ?? 0;
    if (!pageMap.has(pi)) pageMap.set(pi, []);
    pageMap.get(pi)!.push(block);
  }
  const pageIndices = Array.from(pageMap.keys()).sort((a, b) => a - b);
  if (pageIndices.length === 0) pageIndices.push(0);

  return (
    <div
      id="np-print-target"
      style={{
        maxWidth: "820px",
        margin: "0 auto",
        background: "white",
        color: "#1a1a1a",
        fontFamily: "'EB Garamond', Georgia, 'Times New Roman', serif",
        fontSize: "16px",
        lineHeight: 1.6,
        padding: "1.5rem 2rem",
      }}
    >
      {pageIndices.map((pageIdx, pageI) => {
        const pageBlocks = pageMap.get(pageIdx) ?? [];
        const isFirstPage = pageI === 0;
        const hasHeaderBlock = pageBlocks.some((b) => b.type === "header");

        // Separate full-width blocks (header, standalone images) from column blocks
        const fullWidthBlocks = pageBlocks.filter((b) => FULL_WIDTH_TYPES.has(b.type));
        const columnBlocks = pageBlocks.filter((b) => !FULL_WIDTH_TYPES.has(b.type));
        const columns = colCount > 1 ? splitIntoColumns(columnBlocks, colCount) : [columnBlocks];

        return (
          <div
            key={pageIdx}
            style={!isFirstPage ? { breakBefore: "page" as const, pageBreakBefore: "always" } : undefined}
          >
            {/* Screen-only page separator */}
            {!isFirstPage && (
              <div
                className="print:hidden"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  margin: "2.5rem 0",
                }}
              >
                <div style={{ flex: 1, borderTop: "2px dashed #ccc" }} />
                <span style={{ fontSize: "0.7rem", color: "#aaa", letterSpacing: "0.1em" }}>
                  PAGE {pageIdx + 1}
                </span>
                <div style={{ flex: 1, borderTop: "2px dashed #ccc" }} />
              </div>
            )}

            {/* Default masthead (when no header block on page 0) */}
            {isFirstPage && !hasHeaderBlock && (
              <div style={{ textAlign: "center", padding: "0.5rem 0 1.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ flex: 1, height: "3px", background: "#1a1a1a" }} />
                  <div style={{ flex: 1, height: "1px", background: "#1a1a1a", marginTop: "5px" }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                    borderTop: "1px solid #1a1a1a",
                    borderBottom: "1px solid #1a1a1a",
                    padding: "0.25rem 0",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span>
                    {new Date(edition.generated_at).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}
                  </span>
                  <span>
                    {new Date(edition.generated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h1
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    margin: "0 0 0.5rem",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {edition.title.replace(/ - \d{2}\.\d{2}\.\d{4}$/, "")}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <div style={{ flex: 1, height: "1px", background: "#1a1a1a", marginBottom: "5px" }} />
                  <div style={{ flex: 1, height: "3px", background: "#1a1a1a" }} />
                </div>
              </div>
            )}

            {/* Full-width blocks (header, images) — above the columns */}
            {fullWidthBlocks.map((block, j) => {
              const widget = WIDGET_REGISTRY[block.type];
              if (!widget) return null;
              const Preview = widget.previewComponent;
              return (
                <div key={`fw-${j}`} style={{ marginBottom: "0.5rem" }}>
                  <Preview block={block} />
                </div>
              );
            })}

            {/* Column blocks — explicit flex layout (reliable in print) */}
            {columnBlocks.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  alignItems: "flex-start",
                }}
              >
                {columns.map((colBlocks, ci) => (
                  <div
                    key={ci}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      paddingLeft: ci > 0 ? "1.5rem" : undefined,
                      paddingRight: ci < colCount - 1 ? "1.5rem" : undefined,
                      borderLeft: ci > 0 ? "1px solid #d4d0c8" : undefined,
                    }}
                  >
                    {colBlocks.map((block, j) => {
                      const widget = WIDGET_REGISTRY[block.type];
                      if (!widget) return null;
                      const Preview = widget.previewComponent;
                      return (
                        <div
                          key={j}
                          style={{
                            padding: "0.85rem 0",
                            borderBottom:
                              j < colBlocks.length - 1 ? "1px solid #d4d0c8" : undefined,
                          }}
                        >
                          <Preview block={block} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {pageBlocks.length === 0 && isFirstPage && edition.content.length === 0 && (
              <p style={{ textAlign: "center", padding: "3rem 0", fontSize: "0.85em", opacity: 0.5, fontStyle: "italic" }}>
                This edition has no content blocks.
              </p>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div
        style={{
          marginTop: "2rem",
          borderTop: "2px solid #1a1a1a",
          paddingTop: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4 }}>
          Generated by Memento
        </span>
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.06em", opacity: 0.35 }}>
          {new Date(edition.generated_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
