import { readFileSync } from 'fs';
import { join } from 'path';
import type { NewspaperConfig, Block, CalendarEntry } from '../lib/types';
import { THEMES, type ThemeName } from './themes';
import { renderTitle } from './blocks/title';
import { renderMarkdown } from './blocks/markdown';
import { renderWeather } from './blocks/weather';
import { renderWritingLines } from './blocks/writing-lines';
import { renderCalendarWeek } from './blocks/calendar-week';
import { renderCalendarDay } from './blocks/calendar-day';
import { renderDivider } from './blocks/divider';
import { renderSpacer } from './blocks/spacer';

const baseCssPath = join(__dirname, 'styles', 'base.css');

async function blockToHtml(block: Block, date: string | undefined, globalEntries: CalendarEntry[]): Promise<string> {
  switch (block.type) {
    case 'title':         return renderTitle(block, date);
    case 'markdown':      return renderMarkdown(block);
    case 'weather':       return renderWeather(block);
    case 'writing-lines': return renderWritingLines(block);
    case 'calendar-week': return renderCalendarWeek(block, globalEntries);
    case 'calendar-day':  return renderCalendarDay(block, globalEntries);
    case 'divider':       return renderDivider(block);
    case 'spacer':        return renderSpacer(block);
  }
}

async function blocksToHtml(blocks: Block[], date: string | undefined, globalEntries: CalendarEntry[]): Promise<string> {
  const parts = await Promise.all(blocks.map(b => blockToHtml(b, date, globalEntries)));
  return parts.join('\n');
}

export async function configToHtml(config: NewspaperConfig): Promise<string> {
  const date = config.date ?? new Date().toISOString().slice(0, 10);
  const globalEntries = config.calendar_entries ?? [];
  const margins = config.margins ?? { top: 15, right: 15, bottom: 15, left: 15 };
  const fontSize = config.base_font_size ?? 11;
  const paperSize = config.paper_size ?? 'A4';
  const orientation = config.orientation ?? 'portrait';

  // Resolve theme
  const themeName = (config.theme ?? 'classic') as ThemeName;
  const theme = THEMES[themeName] ?? THEMES['classic'];

  // CSS variables block injected into <style>
  const cssVarBlock = `:root {\n` +
    Object.entries(theme.cssVars).map(([k, v]) => `  ${k}: ${v};`).join('\n') +
    `\n}`;

  // Google Fonts link tags (empty string when not needed)
  const fontsLink = theme.googleFontsUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n  ` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  ` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${theme.googleFontsUrl}">`
    : '';

  // Body font: theme wins; legacy font_family only used when no theme is set
  const fontFamily = config.theme
    ? theme.cssVars['--np-font-body']
    : (config.font_family ?? theme.cssVars['--np-font-body']);

  let baseCss = '';
  try {
    baseCss = readFileSync(baseCssPath, 'utf-8');
  } catch {
    // fallback: inline minimal CSS if file not found at runtime
    baseCss = '';
  }

  const pageBreakCss = `
    @page { size: ${paperSize} ${orientation}; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
    body { font-family: ${fontFamily}; font-size: ${fontSize}px; }
  `;

  const pagesHtml: string[] = [];
  for (const page of config.pages) {
    let pageContent = '';

    if (page.layout === 'single') {
      const blocks = page.blocks ?? [];
      pageContent = await blocksToHtml(blocks, date, globalEntries);
    } else {
      const columns = page.columns ?? [];
      const colCount = page.layout === 'three-column' ? 3 : 2;
      const gap = page.column_gap ?? 5;
      const cssClass = colCount === 3 ? 'columns-3' : 'columns-2';
      const gapStyle = `gap:${gap}mm;`;

      pageContent += `<div class="${cssClass}" style="${gapStyle}">`;
      for (let i = 0; i < colCount; i++) {
        const colBlocks = columns[i] ?? [];
        const colHtml = await blocksToHtml(colBlocks, date, globalEntries);
        pageContent += `<div class="column">${colHtml}</div>`;
      }
      pageContent += `</div>`;
    }

    pagesHtml.push(`<div class="page">${pageContent}</div>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(config.title)}</title>
  ${fontsLink}
  <style>
${baseCss}
${cssVarBlock}
${pageBreakCss}
  </style>
</head>
<body>
${pagesHtml.join('\n')}
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
