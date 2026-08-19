import type { Locale } from './i18n/types.ts';
import type { ProviderBooking, ProviderFinanceAnalyticsPoint } from '../types/providerDashboard.ts';
import type { ServiceRequestCard } from '../types/serviceRequests.ts';
import { formatRelativeOfferDay } from './formatRelativeDay.ts';

export function formatProviderMoney(amount: number, _locale: Locale): string {
  return formatWesternNumber(amount);
}

/** Always use Western digits (0-9) regardless of UI locale. */
export function formatWesternNumber(amount: number, fractionDigits = 0): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatProviderBudget(
  budgetMin?: string | null,
  budgetMax?: string | null,
  locale: Locale = 'ar',
): string {
  const currency = locale === 'ar' ? 'ر.س' : 'SAR';
  const min = budgetMin ? Number(budgetMin) : null;
  const max = budgetMax ? Number(budgetMax) : null;

  if (min != null && max != null && min !== max) {
    return `${formatWesternNumber(min)} - ${formatWesternNumber(max)} ${currency}`;
  }

  if (min != null && max == null) {
    return `${formatWesternNumber(min)}+ ${currency}`;
  }

  if (max != null) {
    return `${formatWesternNumber(max)} ${currency}`;
  }

  return locale === 'ar' ? 'غير محدد' : 'Not specified';
}

export function formatProviderRequestDate(value: string | undefined, locale: Locale): string {
  return formatRelativeOfferDay(value, locale);
}

export function providerCategoryLabel(
  item: Pick<ServiceRequestCard, 'categories'>,
  locale: Locale,
): string {
  const category = item.categories?.[0];
  if (!category) {
    return locale === 'ar' ? 'خدمة عامة' : 'General service';
  }
  return locale === 'ar' ? category.name_ar : category.name_en;
}

export function mapProviderBookingUiStatus(
  booking: Pick<ProviderBooking, 'status'>,
): 'pending' | 'upcoming' | 'completed' | 'cancelled' {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }
  if (booking.status === 'completed') {
    return 'completed';
  }
  if (
    booking.status === 'pending_provider_confirmation' ||
    booking.status === 'pending_customer_acceptance' ||
    booking.status === 'pending_payment'
  ) {
    return 'pending';
  }
  return 'upcoming';
}

export function formatBookingDisplayDate(booking: ProviderBooking): string {
  if (booking.scheduled_date) {
    return booking.scheduled_date;
  }
  if (booking.created_at) {
    return booking.created_at.slice(0, 10);
  }
  return '—';
}

export function formatBookingDisplayTime(booking: ProviderBooking): string {
  if (booking.scheduled_time) {
    return booking.scheduled_time;
  }
  return '—';
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const WEEKDAY_LABELS: Record<Locale, string[]> = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const MONTH_LABELS: Record<Locale, string[]> = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function formatFinanceAnalyticsLabel(
  point: ProviderFinanceAnalyticsPoint,
  locale: Locale,
): string {
  if (point.date) {
    const date = new Date(`${point.date}T12:00:00`);
    const day = date.getDate();
    const month = MONTH_LABELS[locale][date.getMonth()] ?? '';
    return locale === 'ar' ? `${day} ${month}` : `${month} ${day}`;
  }

  return point.name ?? '';
}

export function buildProviderDashboardStats(bookings: ProviderBooking[], locale: Locale = 'ar') {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const todayKey = now.toISOString().slice(0, 10);

  let monthlyEarnings = 0;
  let activeBookings = 0;

  const completedByDay = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    completedByDay.set(d.toISOString().slice(0, 10), 0);
  }

  bookings.forEach((booking) => {
    const price = Number(booking.price) || 0;
    const uiStatus = mapProviderBookingUiStatus(booking);

    if (uiStatus === 'upcoming') {
      activeBookings += 1;
    }

    if (booking.status === 'completed' && booking.created_at) {
      const created = new Date(booking.created_at);
      if (created.getMonth() === month && created.getFullYear() === year) {
        monthlyEarnings += price;
      }
      const dayKey = booking.completed_at?.slice(0, 10) ?? booking.created_at.slice(0, 10);
      if (completedByDay.has(dayKey)) {
        completedByDay.set(dayKey, (completedByDay.get(dayKey) ?? 0) + price);
      }
    }
  });

  const weekdayLabels = WEEKDAY_LABELS[locale];
  const chartData = Array.from(completedByDay.entries()).map(([dayKey, earnings]) => {
    const date = new Date(`${dayKey}T12:00:00`);
    return {
      name: weekdayLabels[date.getDay()] ?? dayKey,
      earnings,
    };
  });

  const todaysAppointments = bookings
    .filter((booking) => {
      const uiStatus = mapProviderBookingUiStatus(booking);
      if (uiStatus !== 'upcoming') {
        return false;
      }
      const dateKey = booking.scheduled_date ?? booking.created_at?.slice(0, 10);
      return dateKey === todayKey;
    })
    .slice(0, 5);

  return {
    monthlyEarnings,
    activeBookings,
    chartData,
    todaysAppointments,
  };
}

export function formatProviderServiceDuration(service: {
  duration_label?: string | null;
}): string | null {
  const value = service.duration_label?.trim();
  return value || null;
}

export function formatProviderServicePrice(service: {
  starting_price?: number | null;
  pricing_label?: string | null;
}): string {
  if (service.starting_price != null) {
    return String(service.starting_price);
  }
  return service.pricing_label ?? '—';
}
