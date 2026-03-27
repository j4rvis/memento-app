/**
 * Resolves a DateExpr to an ISO date string (YYYY-MM-DD).
 *
 * Supported expressions:
 *   "today"            → reference date
 *   "tomorrow"         → reference + 1 day
 *   "yesterday"        → reference - 1 day
 *   "week-start"       → Monday of the reference week
 *   "week-end"         → Sunday of the reference week
 *   "next-week-start"  → Monday of next week
 *   "next-week-end"    → Sunday of next week
 *   "+N" / "-N"        → reference ± N days (e.g. "+3", "-1", "+0")
 *   ISO date string    → passed through unchanged
 *   undefined          → today
 *
 * All arithmetic uses local date methods to avoid UTC timezone shifts.
 *
 * @param expr - A DateExpr string or undefined
 * @param ref  - Reference date (defaults to new Date()). Inject for testability.
 */
export function resolveDate(expr: string | undefined, ref?: Date): string {
  const base = ref ?? new Date();

  if (!expr || expr === 'today') {
    return isoDate(base);
  }

  if (expr === 'tomorrow') {
    return isoDate(addDays(base, 1));
  }

  if (expr === 'yesterday') {
    return isoDate(addDays(base, -1));
  }

  if (expr === 'week-start') {
    return isoDate(weekStart(base));
  }

  if (expr === 'week-end') {
    return isoDate(addDays(weekStart(base), 6));
  }

  if (expr === 'next-week-start') {
    return isoDate(addDays(weekStart(base), 7));
  }

  if (expr === 'next-week-end') {
    return isoDate(addDays(weekStart(base), 13));
  }

  // "+N" or "-N" relative offset
  const relMatch = expr.match(/^([+-]\d+)$/);
  if (relMatch) {
    const offset = parseInt(relMatch[1], 10);
    return isoDate(addDays(base, offset));
  }

  // Pass through ISO strings and anything unrecognised
  return expr;
}

/** Returns the Monday of the week containing `d` (using local time). */
function weekStart(d: Date): Date {
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // Days to subtract to reach Monday: (getDay() + 6) % 7
  const daysBack = (d.getDay() + 6) % 7;
  return addDays(d, -daysBack);
}

/** Adds `n` days to `d` using local date arithmetic. */
function addDays(d: Date, n: number): Date {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return result;
}

/** Formats a Date as YYYY-MM-DD using local time. */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
