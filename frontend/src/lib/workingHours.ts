import type { VendorWorkingHour, Weekday } from '../api/vendorSettings.ts';

export const WEEKDAYS: Weekday[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export function defaultWorkingHours(): VendorWorkingHour[] {
  return WEEKDAYS.map((day) => ({
    day,
    is_closed: day === 'friday',
    opens_at: day === 'friday' ? '16:00' : '09:00',
    closes_at: '22:00',
  }));
}

export function normalizeWorkingHours(hours: VendorWorkingHour[] | undefined): VendorWorkingHour[] {
  if (!hours?.length) {
    return defaultWorkingHours();
  }

  const byDay = new Map(hours.map((entry) => [entry.day, entry]));
  return WEEKDAYS.map((day) => {
    const existing = byDay.get(day);
    if (!existing) {
      return defaultWorkingHours().find((entry) => entry.day === day)!;
    }
    return {
      day,
      is_closed: existing.is_closed,
      opens_at: existing.is_closed ? null : (existing.opens_at ?? '09:00'),
      closes_at: existing.is_closed ? null : (existing.closes_at ?? '22:00'),
    };
  });
}

export function validateWorkingHours(
  hours: VendorWorkingHour[],
  invalidMessage: (dayLabel: string) => string,
  dayLabel: (day: Weekday) => string,
): string | null {
  for (const entry of hours) {
    if (entry.is_closed) continue;
    if (!entry.opens_at || !entry.closes_at || entry.opens_at >= entry.closes_at) {
      return invalidMessage(dayLabel(entry.day));
    }
  }
  return null;
}
