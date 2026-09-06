import type { VendorWorkingHour, Weekday } from '../../../api/vendorSettings.ts';
import type { Locale } from '../../../lib/i18n/types.ts';
import { getFieldErrors } from '../../../utils/errors.ts';
import { WEEKDAYS } from './vendorSettings.types.ts';

export function sanitizeStoreSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 80);
}

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

export function firstFieldErrorMap(error: unknown): Record<string, string> {
  const fields = getFieldErrors(error);
  return Object.fromEntries(
    Object.entries(fields).map(([field, messages]) => [field, messages[0] ?? '']),
  );
}

export function readPreferenceLocale(
  preferences: Record<string, unknown> | undefined,
): Locale | null {
  const value = preferences?.locale;
  return value === 'ar' || value === 'en' ? value : null;
}

export function updateWorkingHour(
  hours: VendorWorkingHour[],
  day: Weekday,
  patch: Partial<VendorWorkingHour>,
): VendorWorkingHour[] {
  return hours.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry));
}
