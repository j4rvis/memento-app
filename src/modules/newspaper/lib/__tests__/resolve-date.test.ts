import { describe, it, expect } from 'vitest';
import { resolveDate } from '../resolve-date';

// Fixed reference: Wednesday 2026-03-25 (mid-week, not Mon/Sun edge case)
const REF = new Date(2026, 2, 25); // month is 0-indexed

describe('resolveDate', () => {
  it('resolves "today" to the reference date', () => {
    expect(resolveDate('today', REF)).toBe('2026-03-25');
  });

  it('resolves "tomorrow" to reference + 1 day', () => {
    expect(resolveDate('tomorrow', REF)).toBe('2026-03-26');
  });

  it('resolves "yesterday" to reference - 1 day', () => {
    expect(resolveDate('yesterday', REF)).toBe('2026-03-24');
  });

  it('resolves "week-start" to Monday of the reference week', () => {
    // 2026-03-25 is Wednesday → Monday is 2026-03-23
    expect(resolveDate('week-start', REF)).toBe('2026-03-23');
  });

  it('resolves "week-end" to Sunday of the reference week', () => {
    // Monday 2026-03-23 + 6 = Sunday 2026-03-29
    expect(resolveDate('week-end', REF)).toBe('2026-03-29');
  });

  it('resolves "next-week-start" to Monday of next week', () => {
    expect(resolveDate('next-week-start', REF)).toBe('2026-03-30');
  });

  it('resolves "next-week-end" to Sunday of next week', () => {
    expect(resolveDate('next-week-end', REF)).toBe('2026-04-05');
  });

  it('resolves "+3" to reference + 3 days', () => {
    expect(resolveDate('+3', REF)).toBe('2026-03-28');
  });

  it('resolves "-1" to reference - 1 day', () => {
    expect(resolveDate('-1', REF)).toBe('2026-03-24');
  });

  it('resolves "+0" to the reference date', () => {
    expect(resolveDate('+0', REF)).toBe('2026-03-25');
  });

  it('passes through an ISO date string unchanged', () => {
    expect(resolveDate('2025-12-31', REF)).toBe('2025-12-31');
  });

  it('returns today when expr is undefined', () => {
    // Without injected ref it would use real today — use REF to keep deterministic
    expect(resolveDate(undefined, REF)).toBe('2026-03-25');
  });

  describe('edge case: reference is a Sunday', () => {
    const sunday = new Date(2026, 2, 29); // 2026-03-29 is Sunday

    it('week-start is 6 days back (Monday)', () => {
      expect(resolveDate('week-start', sunday)).toBe('2026-03-23');
    });

    it('week-end is the same Sunday', () => {
      expect(resolveDate('week-end', sunday)).toBe('2026-03-29');
    });
  });

  describe('edge case: reference is a Monday', () => {
    const monday = new Date(2026, 2, 23); // 2026-03-23 is Monday

    it('week-start is the same Monday', () => {
      expect(resolveDate('week-start', monday)).toBe('2026-03-23');
    });

    it('week-end is the following Sunday', () => {
      expect(resolveDate('week-end', monday)).toBe('2026-03-29');
    });
  });

  it('resolves month-boundary correctly (+7 crosses March→April)', () => {
    const ref = new Date(2026, 2, 28); // 2026-03-28
    expect(resolveDate('+7', ref)).toBe('2026-04-04');
  });
});
