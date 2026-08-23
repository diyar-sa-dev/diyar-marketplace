export const BOOKING_MAX_YEARS_AHEAD = 5;
export const BOOKING_MIN_LEAD_HOURS = 2;

export type DirectBookingScheduleErrorKey =
  | 'directBooking.scheduleRequired'
  | 'directBooking.scheduleInvalid'
  | 'directBooking.scheduleOutOfRange'
  | 'directBooking.scheduleTooSoon';

export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function maxBookingIsoDate(years = BOOKING_MAX_YEARS_AHEAD): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return localIsoDate(date);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

export function minTimeForDate(dateIso: string): string | undefined {
  if (!isValidIsoDate(dateIso)) {
    return undefined;
  }

  const today = localIsoDate();
  if (dateIso !== today) {
    return '00:00';
  }

  const minimum = new Date();
  minimum.setHours(minimum.getHours() + BOOKING_MIN_LEAD_HOURS, minimum.getMinutes(), 0, 0);

  return `${String(minimum.getHours()).padStart(2, '0')}:${String(minimum.getMinutes()).padStart(2, '0')}`;
}

export function clampTimeToMin(dateIso: string, time: string): string {
  const minimum = minTimeForDate(dateIso);
  if (!minimum || !time) {
    return time;
  }

  return time < minimum ? minimum : time;
}

export function defaultBookingTimeForDate(dateIso: string): string {
  const minimum = minTimeForDate(dateIso);
  if (!minimum) {
    return '10:00';
  }

  if (dateIso !== localIsoDate()) {
    return '10:00';
  }

  return '10:00' >= minimum ? '10:00' : minimum;
}

export function validateDirectBookingSchedule(
  date: string,
  time: string,
): DirectBookingScheduleErrorKey | null {
  if (!date.trim() || !time.trim()) {
    return 'directBooking.scheduleRequired';
  }

  if (!isValidIsoDate(date)) {
    return 'directBooking.scheduleInvalid';
  }

  const minDate = localIsoDate();
  const maxDate = maxBookingIsoDate();

  if (date < minDate || date > maxDate) {
    return 'directBooking.scheduleOutOfRange';
  }

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!timeMatch) {
    return 'directBooking.scheduleInvalid';
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours > 23 || minutes > 59) {
    return 'directBooking.scheduleInvalid';
  }

  const slot = new Date(date);
  slot.setHours(hours, minutes, 0, 0);

  const minimumSlot = new Date();
  minimumSlot.setHours(
    minimumSlot.getHours() + BOOKING_MIN_LEAD_HOURS,
    minimumSlot.getMinutes(),
    0,
    0,
  );

  if (slot.getTime() < minimumSlot.getTime()) {
    return 'directBooking.scheduleTooSoon';
  }

  return null;
}

export function formatBookingScheduleDate(dateIso: string, locale: string): string {
  if (!isValidIsoDate(dateIso)) {
    return dateIso;
  }

  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatBookingScheduleTime(time: string, locale: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return time;
  }

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
