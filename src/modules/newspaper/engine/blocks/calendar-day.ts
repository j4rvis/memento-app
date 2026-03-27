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
  const dayEntries = allEntries.filter(e => {
    if (e.all_day) return e.start_at.slice(0, 10) === dateStr;
    return e.start_at.slice(0, 10) === dateStr;
  });

  // Build 30-min slots
  const slots: { label: string; hour: number; minute: number }[] = [];
  for (let h = hourStart; h < hourEnd; h++) {
    slots.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 });
    slots.push({ label: '', hour: h, minute: 30 });
  }

  let html = `<div class="block-calendar-day">`;
  html += `<table>`;
  html += `<thead><tr>`;
  html += `<th class="time-col">Time</th>`;
  html += `<th>${dateStr}</th>`;
  html += `</tr></thead>`;
  html += `<tbody>`;

  let rowspanDebt = 0; // rows already covered by a previous td's rowspan

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const slotEntries = dayEntries.filter(e => {
      if (e.all_day) return slot.hour === hourStart && slot.minute === 0;
      const start = new Date(e.start_at);
      return start.getHours() === slot.hour &&
        (slot.minute === 0 ? start.getMinutes() < 30 : start.getMinutes() >= 30);
    });

    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;">${slot.label}</td>`;

    if (rowspanDebt > 0) {
      rowspanDebt--;
      // This cell is covered by a previous rowspan — no td rendered
    } else {
      // Calculate rowspan: use the longest-duration entry in this slot
      let rowspan = 1;
      if (slotEntries.length > 0) {
        rowspan = slotEntries.reduce((max, entry) => {
          return Math.max(max, calcRowspan(entry, i, slots.length));
        }, 1);
        if (rowspan > 1) rowspanDebt = rowspan - 1;
      }

      const borderStyle = showLines && !slotEntries.length ? 'border-bottom: 1px solid #eee;' : '';
      const rowspanAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
      html += `<td${rowspanAttr} style="height:${slotHeight}mm;${borderStyle}vertical-align:top;">`;
      for (const entry of slotEntries) {
        const color = entryColor(entry.color);
        const entrySpan = calcRowspan(entry, i, slots.length);
        const entryHeight = entrySpan * slotHeight - 1;
        html += `<div class="calendar-entry" style="border-left-color:${color};background:${hexToRgba(color.startsWith('#') ? color : '#4285f4', 0.1)};height:${entryHeight}mm;white-space:normal;overflow:hidden;">`;
        html += esc(entry.title);
        html += `</div>`;
      }
      html += `</td>`;
    }

    html += `</tr>`;
  }

  html += `</tbody></table></div>`;
  return html;
}
