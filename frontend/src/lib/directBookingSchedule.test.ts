import { describe, expect, it } from 'vitest';
import {
  isValidIsoDate,
  localIsoDate,
  maxBookingIsoDate,
  validateDirectBookingSchedule,
} from './directBookingSchedule.ts';

describe('directBookingSchedule', () => {
  it('rejects invalid calendar dates', () => {
    expect(isValidIsoDate('2001-02-30')).toBe(false);
    expect(validateDirectBookingSchedule('2001-02-30', '10:00')).toBe(
      'directBooking.scheduleInvalid',
    );
  });

  it('allows dates within the configured window', () => {
    const today = localIsoDate();
    const max = maxBookingIsoDate();
    expect(today <= max).toBe(true);
  });
});
