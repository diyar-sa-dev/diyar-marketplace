import { describe, expect, it } from 'vitest';
import { analyticsAxisTickInterval, formatAnalyticsAxisLabel } from './formatAnalyticsAxisLabel.ts';

describe('formatAnalyticsAxisLabel', () => {
  it('formats daily ISO dates for the locale', () => {
    expect(formatAnalyticsAxisLabel('2026-08-30', 'en', 'day')).toMatch(/30/);
    expect(formatAnalyticsAxisLabel('2026-08-30', 'ar', 'day')).toMatch(/30/);
  });

  it('formats weekly ranges', () => {
    const label = formatAnalyticsAxisLabel('2026-08-03 — 2026-08-09', 'en', 'week');
    expect(label).toContain('–');
  });

  it('formats month buckets', () => {
    expect(formatAnalyticsAxisLabel('2026-08', 'en', 'month')).toMatch(/2026/);
  });

  it('keeps hour labels as-is', () => {
    expect(formatAnalyticsAxisLabel('14:00', 'ar', 'hour')).toBe('14:00');
  });

  it('formats weekdays for the week view', () => {
    const label = formatAnalyticsAxisLabel('2026-09-01', 'en', 'weekday');
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe('2026-09-01');
  });
});

describe('analyticsAxisTickInterval', () => {
  it('shows every tick for short ranges', () => {
    expect(analyticsAxisTickInterval(7)).toBe(0);
  });

  it('thins ticks for a 30-day range', () => {
    expect(analyticsAxisTickInterval(30)).toBeGreaterThan(0);
  });
});
