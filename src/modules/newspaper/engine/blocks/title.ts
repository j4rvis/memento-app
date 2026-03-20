import type { TitleBlock } from '../../lib/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(isoDate: string, fmt: string): string {
  const d = new Date(isoDate);
  return fmt
    .replace('EEEE', DAY_NAMES[d.getDay()])
    .replace('MMMM', MONTH_NAMES[d.getMonth()])
    .replace('yyyy', String(d.getFullYear()))
    .replace('yy', String(d.getFullYear()).slice(-2))
    .replace('d', String(d.getDate()))
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'));
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
