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

  for (const slot of slots) {
    const slotEntries = dayEntries.filter(e => {
      if (e.all_day) return slot.hour === hourStart && slot.minute === 0;
      const start = new Date(e.start_at);
      return start.getHours() === slot.hour &&
        (slot.minute === 0 ? start.getMinutes() < 30 : start.getMinutes() >= 30);
    });

    const borderStyle = showLines && !slotEntries.length ? 'border-bottom: 1px solid #eee;' : '';
    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;">${slot.label}</td>`;
    html += `<td style="height:${slotHeight}mm;${borderStyle}">`;
    for (const entry of slotEntries) {
      const color = entryColor(entry.color);
      html += `<div class="calendar-entry" style="border-left-color:${color};background:${hexToRgba(color.startsWith('#') ? color : '#4285f4', 0.1)}">`;
      html += esc(entry.title);
      html += `</div>`;
    }
    html += `</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table></div>`;
  return html;
}
