import type { CalendarDayBlock, CalendarEntry } from '../../lib/types';

function entryColor(color?: string): string {
  return color ?? '#4285f4';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function calcRowspan(entry: CalendarEntry, slotIndex: number, totalSlots: number): number {
  if (entry.all_day) return 1;
  const start = new Date(entry.start_at);
  const end = new Date(entry.end_at);
  const durationMs = end.getTime() - start.getTime();
  const durationSlots = Math.round(durationMs / (30 * 60 * 1000));
  return Math.min(Math.max(1, durationSlots), totalSlots - slotIndex);
}

function renderEntryCell(entry: CalendarEntry, heightMm: number, color: string): string {
  return `<div class="calendar-entry" style="border-left-color:${color};background:${hexToRgba(color.startsWith('#') ? color : '#4285f4', 0.1)};height:${heightMm}mm;white-space:normal;overflow:hidden;">${esc(entry.title)}</div>`;
}

export function renderCalendarDay(block: CalendarDayBlock, globalEntries: CalendarEntry[] = []): string {
  const [hourStart, hourEnd] = block.hours ?? [7, 21];
  const slotHeight = block.slot_height_mm ?? 5;
  const showLines = block.show_lines !== false;
  const useGlobal = block.use_global_entries !== false;
  const dateStr = block.date;

  const allEntries: CalendarEntry[] = [
    ...(useGlobal ? globalEntries : []),
    ...(block.entries ?? []),
  ];

  // Filter entries to this day
  const dayEntries = allEntries.filter(e => e.start_at.slice(0, 10) === dateStr);

  // Separate full-day from timed
  const allDayEntries = dayEntries.filter(e => e.all_day);
  const timedEntries = dayEntries.filter(e => !e.all_day);

  // Trim time range: 1 slot (30 min) per all-day event beyond the first 2
  const trimSlots = Math.max(0, allDayEntries.length - 2);

  // Build 30-min slots (trimmed from end)
  const slots: { label: string; hour: number; minute: number }[] = [];
  for (let h = hourStart; h < hourEnd; h++) {
    slots.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 });
    slots.push({ label: '', hour: h, minute: 30 });
  }
  const trimmedSlots = slots.slice(0, slots.length - trimSlots);

  let html = `<div class="block-calendar-day">`;
  html += `<table>`;
  html += `<thead><tr>`;
  html += `<th class="time-col">Time</th>`;
  html += `<th>${dateStr}</th>`;
  html += `</tr></thead>`;
  html += `<tbody>`;

  // All-day rows (one per event)
  for (const entry of allDayEntries) {
    const color = entryColor(entry.color);
    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;font-size:0.8em;color:#888;"></td>`;
    html += `<td style="height:${slotHeight}mm;vertical-align:top;">`;
    html += renderEntryCell(entry, slotHeight - 1, color);
    html += `</td>`;
    html += `</tr>`;
  }

  // Timed rows
  let rowspanDebt = 0;

  for (let i = 0; i < trimmedSlots.length; i++) {
    const slot = trimmedSlots[i];
    const slotEntries = timedEntries.filter(e => {
      const start = new Date(e.start_at);
      return start.getHours() === slot.hour &&
        (slot.minute === 0 ? start.getMinutes() < 30 : start.getMinutes() >= 30);
    });

    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;">${slot.label}</td>`;

    if (rowspanDebt > 0) {
      rowspanDebt--;
    } else {
      let rowspan = 1;
      if (slotEntries.length > 0) {
        rowspan = slotEntries.reduce((max, entry) => {
          return Math.max(max, calcRowspan(entry, i, trimmedSlots.length));
        }, 1);
        if (rowspan > 1) rowspanDebt = rowspan - 1;
      }

      const borderStyle = showLines && !slotEntries.length ? 'border-bottom: 1px solid #eee;' : '';
      const rowspanAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
      html += `<td${rowspanAttr} style="height:${slotHeight}mm;${borderStyle}vertical-align:top;">`;
      for (const entry of slotEntries) {
        const color = entryColor(entry.color);
        const entrySpan = calcRowspan(entry, i, trimmedSlots.length);
        const entryHeight = entrySpan * slotHeight - 1;
        html += renderEntryCell(entry, entryHeight, color);
      }
      html += `</td>`;
    }

    html += `</tr>`;
  }

  html += `</tbody></table></div>`;
  return html;
}
