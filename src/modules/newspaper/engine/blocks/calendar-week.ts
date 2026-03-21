import type { CalendarWeekBlock, CalendarEntry } from '../../lib/types';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date): string {
  // Use local getters so dates match the local-time strings in calendar entries
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function renderCalendarWeek(block: CalendarWeekBlock, globalEntries: CalendarEntry[] = []): string {
  const weekStart = block.week_start ?? 'monday';
  const [hourStart, hourEnd] = block.hours ?? [8, 20];
  const slotHeight = block.slot_height_mm ?? 6;
  const useGlobal = block.use_global_entries !== false;

  // Compute the 7 days of the week
  const startDate = new Date(block.start_date + 'T00:00:00');
  // If weekStart is 'monday', ensure startDate is Monday
  const startOffset = weekStart === 'monday' ? (startDate.getDay() + 6) % 7 : startDate.getDay();
  const monday = addDays(startDate, -startOffset);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, weekStart === 'monday' ? i : i));

  const allEntries: CalendarEntry[] = [
    ...(useGlobal ? globalEntries : []),
    ...(block.entries ?? []),
  ];

  // Filter entries to this week
  const weekDates = days.map(isoDate);
  const entriesByDay: Map<string, CalendarEntry[]> = new Map();
  for (const day of weekDates) entryMap(entriesByDay, day);

  for (const entry of allEntries) {
    const entryDate = entry.start_at.slice(0, 10);
    if (weekDates.includes(entryDate)) {
      entriesByDay.get(entryDate)!.push(entry);
    }
  }

  let html = `<div class="block-calendar-week">`;

  if (block.show_week_number) {
    html += `<div class="calendar-week-number">Week ${getWeekNumber(monday)}</div>`;
  }

  html += `<table>`;
  // Header row
  html += `<thead><tr>`;
  html += `<th class="time-col"></th>`;
  for (const day of days) {
    html += `<th>${DAY_ABBR[day.getDay()]} ${day.getDate()} ${MONTH_ABBR[day.getMonth()]}</th>`;
  }
  html += `</tr></thead>`;

  html += `<tbody>`;
  for (let hour = hourStart; hour < hourEnd; hour++) {
    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;">${hour}:00</td>`;
    for (const day of days) {
      const dayStr = isoDate(day);
      const entries = (entriesByDay.get(dayStr) ?? []).filter(e => {
        if (e.all_day) return false;
        const h = new Date(e.start_at).getHours();
        return h === hour;
      });
      html += `<td style="height:${slotHeight}mm;">`;
      for (const entry of entries) {
        const color = entryColor(entry.color);
        html += `<div class="calendar-entry" style="border-left-color:${color};background:${hexToRgba(color.startsWith('#') ? color : '#4285f4', 0.1)}">`;
        html += `${esc(entry.title)}`;
        html += `</div>`;
      }
      html += `</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

function entryMap(map: Map<string, CalendarEntry[]>, key: string) {
  if (!map.has(key)) map.set(key, []);
}
