import type { TitleBlock } from '../../lib/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(isoDate: string, fmt: string): string {
  // Parse as local noon to avoid UTC-vs-local day-of-week mismatch
  const [y, m, day] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, day, 12, 0, 0);
  const tokens: Record<string, string> = {
    'EEEE': DAY_NAMES[d.getDay()],
    'MMMM': MONTH_NAMES[d.getMonth()],
    'yyyy': String(d.getFullYear()),
    'yy': String(d.getFullYear()).slice(-2),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'd': String(d.getDate()),
  };
  // Replace all tokens in one pass so 'd' doesn't hit letters in day names
  return fmt.replace(/EEEE|MMMM|yyyy|yy|MM|d/g, (match) => tokens[match] ?? match);
}

export function renderTitle(block: TitleBlock, date?: string): string {
  const style = block.style ?? 'newspaper';
  const border = block.border ?? 'none';

  const borderClass = border !== 'none' ? ` border-${border}` : '';

  let html = `<div class="block-title style-${style}${borderClass}">`;
  html += `<h1>${esc(block.text)}</h1>`;
  if (block.subtitle) {
    html += `<div class="subtitle">${esc(block.subtitle)}</div>`;
  }
  if (block.date_format && date) {
    html += `<div class="date-line">${esc(formatDate(date, block.date_format))}</div>`;
  }
  html += '</div>';
  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
