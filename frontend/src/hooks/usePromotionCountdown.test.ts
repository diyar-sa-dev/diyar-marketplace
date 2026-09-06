import { describe, expect, it } from 'vitest';
import type { TranslateFn } from '../lib/i18n/types.ts';
import { formatCountdownSeconds, formatPromotionRemaining } from './usePromotionCountdown.ts';

const t: TranslateFn = (key, params) => {
  const templates: Record<string, string> = {
    'home.featuredDeals.countdownDay': '{{count}} day',
    'home.featuredDeals.countdownDays': '{{count}} days',
  };

  return Object.entries(params ?? {}).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    templates[key] ?? key,
  );
};

describe('formatCountdownSeconds', () => {
  it('pads hours minutes and seconds', () => {
    expect(formatCountdownSeconds(5)).toBe('00:00:05');
    expect(formatCountdownSeconds(3661)).toBe('01:01:01');
  });
});

describe('formatPromotionRemaining', () => {
  it('shows a clock only under 24 hours', () => {
    expect(formatPromotionRemaining(0, t)).toEqual({ label: '00:00:00', isClock: true });
    expect(formatPromotionRemaining(23 * 3600 + 59 * 60 + 59, t)).toEqual({
      label: '23:59:59',
      isClock: true,
    });
  });

  it('shows days when hours would exceed 23 and remaining is under a week', () => {
    expect(formatPromotionRemaining(24 * 3600, t)).toEqual({ label: '1 day', isClock: false });
    expect(formatPromotionRemaining(3 * 86_400 + 3600, t)).toEqual({
      label: '3 days',
      isClock: false,
    });
    expect(formatPromotionRemaining(6 * 86_400 + 23 * 3600, t)).toEqual({
      label: '6 days',
      isClock: false,
    });
  });

  it('hides the countdown when remaining is a week or longer', () => {
    expect(formatPromotionRemaining(7 * 86_400, t)).toBeNull();
    expect(formatPromotionRemaining(29 * 86_400, t)).toBeNull();
    expect(formatPromotionRemaining(30 * 86_400, t)).toBeNull();
    expect(formatPromotionRemaining(365 * 86_400, t)).toBeNull();
  });

  it('does not render overflowing hour clocks like 1726:30:23', () => {
    const overflowingClockSeconds = 1726 * 3600 + 30 * 60 + 23;
    expect(formatPromotionRemaining(overflowingClockSeconds, t)).toBeNull();
  });
});
