import type { CalendarWeekBlock, CalendarEntry } from '../../lib/types';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLocalHour(isoString: string, timezone: string): number {
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  return h === 24 ? 0 : h;
}

function getLocalDate(isoString: string, timezone: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).format(date); // yields "YYYY-MM-DD"
}

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

function renderEntryDiv(entry: CalendarEntry, heightMm: number, color: string): string {
  return `<div class="calendar-entry" style="border-left-color:${color};background:${hexToRgba(color.startsWith('#') ? color : '#4285f4', 0.1)};height:${heightMm}mm;white-space:normal;overflow:hidden;">${esc(entry.title)}</div>`;
}

export function renderCalendarWeek(block: CalendarWeekBlock, globalEntries: CalendarEntry[] = [], timezone = 'UTC'): string {
  const weekStart = block.week_start ?? 'monday';
  const [hourStart, hourEnd] = block.hours ?? [8, 20];
  const slotHeight = block.slot_height_mm ?? 6;
  const useGlobal = block.use_global_entries !== false;

  // Compute the 7 days of the week
  const startDate = new Date(block.start_date + 'T00:00:00');
  const startOffset = weekStart === 'monday' ? (startDate.getDay() + 6) % 7 : startDate.getDay();
  const monday = addDays(startDate, -startOffset);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(monday, weekStart === 'monday' ? i : i));

  const allEntries: CalendarEntry[] = [
    ...(useGlobal ? globalEntries : []),
    ...(block.entries ?? []),
  ];

  // Filter entries to this week, separated into all-day and timed
  const weekDates = days.map(isoDate);
  const allDayByDay: Map<string, CalendarEntry[]> = new Map();
  const timedByDay: Map<string, CalendarEntry[]> = new Map();
  for (const day of weekDates) {
    allDayByDay.set(day, []);
    timedByDay.set(day, []);
  }

  for (const entry of allEntries) {
    const entryDate = entry.all_day ? entry.start_at.slice(0, 10) : getLocalDate(entry.start_at, timezone);
    if (!weekDates.includes(entryDate)) continue;
    if (entry.all_day) {
      allDayByDay.get(entryDate)!.push(entry);
    } else {
      timedByDay.get(entryDate)!.push(entry);
    }
  }

  // All-day row count = max all-day events across any single day
  const allDayRowCount = Math.max(0, ...weekDates.map(d => allDayByDay.get(d)!.length));

  // Trim time range: 1 hour per all-day row beyond the first 2
  const trimRows = Math.max(0, allDayRowCount - 2);
  const totalHours = Math.max(0, (hourEnd - hourStart) - trimRows);

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

  // All-day rows (one per row, up to allDayRowCount)
  for (let rowIdx = 0; rowIdx < allDayRowCount; rowIdx++) {
    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;font-size:0.8em;color:#888;"></td>`;
    for (const dayStr of weekDates) {
      const dayAllDay = allDayByDay.get(dayStr)!;
      const entry = dayAllDay[rowIdx];
      html += `<td style="height:${slotHeight}mm;vertical-align:top;padding:0;">`;
      html += `<div style="height:${slotHeight}mm;overflow:hidden;">`;
      if (entry) {
        const color = entryColor(entry.color);
        html += renderEntryDiv(entry, slotHeight - 1, color);
      }
      html += `</div></td>`;
    }
    html += `</tr>`;
  }

  // Track rowspan debt per day column independently
  const rowspanDebt: number[] = new Array(days.length).fill(0);

  // Timed rows
  for (let hi = 0; hi < totalHours; hi++) {
    const hour = hourStart + hi;
    html += `<tr>`;
    html += `<td class="time-col" style="height:${slotHeight}mm;">${hour}:00</td>`;
    for (let di = 0; di < days.length; di++) {
      const dayStr = weekDates[di];
      if (rowspanDebt[di] > 0) {
        rowspanDebt[di]--;
        continue;
      }
      const entries = (timedByDay.get(dayStr) ?? []).filter(e => {
        // all_day entries are excluded — they are already shown in the all-day section above
        if (e.all_day) return false;
        return getLocalHour(e.start_at, timezone) === hour;
      });

      let rowspan = 1;
      if (entries.length > 0) {
        rowspan = entries.reduce((max, entry) => {
          const start = new Date(entry.start_at);
          const end = new Date(entry.end_at);
          const durationHours = Math.round((end.getTime() - start.getTime()) / (60 * 60 * 1000));
          const span = Math.min(Math.max(1, durationHours), totalHours - hi);
          return Math.max(max, span);
        }, 1);
        if (rowspan > 1) rowspanDebt[di] = rowspan - 1;
      }

      const rowspanAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
      const cellHeight = rowspan * slotHeight;
      html += `<td${rowspanAttr} style="height:${slotHeight}mm;vertical-align:top;padding:0;">`;
      html += `<div style="height:${cellHeight}mm;overflow:hidden;display:flex;flex-direction:row;gap:0.5mm;">`;
      if (entries.length === 0) {
        html += `<div style="flex:1;"></div>`;
      }
      for (const entry of entries) {
        const color = entryColor(entry.color);
        const start = new Date(entry.start_at);
        const end = new Date(entry.end_at);
        const durationHours = Math.round((end.getTime() - start.getTime()) / (60 * 60 * 1000));
        const entrySpan = Math.min(Math.max(1, durationHours), totalHours - hi);
        const entryHeight = entrySpan * slotHeight - 1;
        html += `<div style="flex:1;min-width:0;">` + renderEntryDiv(entry, entryHeight, color) + `</div>`;
      }
      html += `</div></td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}
