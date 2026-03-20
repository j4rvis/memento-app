import type { WritingLinesBlock } from '../../lib/types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderWritingLines(block: WritingLinesBlock): string {
  const spacing = block.line_spacing_mm ?? 8;
  const showMargin = block.show_margin ?? false;
  // Default to 12 lines when count not specified
  const lineCount = block.lines ?? 12;

  let html = `<div class="block-writing-lines">`;
  if (block.label) {
    html += `<div class="writing-label">${esc(block.label)}</div>`;
  }
  for (let i = 0; i < lineCount; i++) {
    html += `<div class="writing-line" style="height:${spacing}mm;">`;
    if (showMargin) {
      html += `<div class="writing-margin"></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}
