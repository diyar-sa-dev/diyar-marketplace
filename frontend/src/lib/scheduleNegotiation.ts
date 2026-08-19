export type ScheduleHistoryEntry = {
  id: string;
  role: 'customer' | 'provider' | 'agreed';
  date: string | null;
  time: string | null;
  state: 'original' | 'active' | 'accepted' | 'superseded';
};

export type ScheduleNegotiationFields = {
  status: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  requested_scheduled_date?: string | null;
  requested_scheduled_time?: string | null;
  proposed_scheduled_date?: string | null;
  proposed_scheduled_time?: string | null;
  last_proposed_scheduled_date?: string | null;
  last_proposed_scheduled_time?: string | null;
  schedule_proposed_at?: string | null;
  provider_notes?: string | null;
  service_offer?: {
    proposed_scheduled_date?: string | null;
    proposed_scheduled_time?: string | null;
  } | null;
};

function normalizeTime(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.slice(0, 5);
}

function sameSchedule(
  leftDate?: string | null,
  leftTime?: string | null,
  rightDate?: string | null,
  rightTime?: string | null,
): boolean {
  return leftDate === rightDate && normalizeTime(leftTime) === normalizeTime(rightTime);
}

export function buildScheduleHistory(booking: ScheduleNegotiationFields): ScheduleHistoryEntry[] {
  const offerDate = booking.service_offer?.proposed_scheduled_date ?? null;
  const requestedDate =
    booking.requested_scheduled_date ?? offerDate ?? booking.scheduled_date ?? null;
  const requestedTime = normalizeTime(
    booking.requested_scheduled_time ??
      booking.service_offer?.proposed_scheduled_time ??
      booking.scheduled_time,
  );
  const activeProposedDate = booking.proposed_scheduled_date ?? null;
  const activeProposedTime = normalizeTime(booking.proposed_scheduled_time);
  const historicalProposedDate = activeProposedDate ?? booking.last_proposed_scheduled_date ?? null;
  const historicalProposedTime = normalizeTime(
    activeProposedTime ?? booking.last_proposed_scheduled_time,
  );
  const agreedDate = booking.scheduled_date ?? null;
  const agreedTime = normalizeTime(booking.scheduled_time);
  const isActiveNegotiation =
    booking.status === 'pending_customer_acceptance' && Boolean(activeProposedDate);
  const hasProviderProposal =
    Boolean(historicalProposedDate) &&
    !sameSchedule(requestedDate, requestedTime, historicalProposedDate, historicalProposedTime);
  const hasAgreedChange =
    Boolean(agreedDate) &&
    !sameSchedule(requestedDate, requestedTime, agreedDate, agreedTime) &&
    !isActiveNegotiation;

  const entries: ScheduleHistoryEntry[] = [];

  if (requestedDate) {
    entries.push({
      id: 'customer-requested',
      role: 'customer',
      date: requestedDate,
      time: requestedTime,
      state: hasProviderProposal || hasAgreedChange ? 'superseded' : 'original',
    });
  }

  if (hasProviderProposal && historicalProposedDate) {
    entries.push({
      id: 'provider-proposed',
      role: 'provider',
      date: historicalProposedDate,
      time: historicalProposedTime,
      state: isActiveNegotiation
        ? 'active'
        : booking.status === 'cancelled'
          ? 'superseded'
          : 'accepted',
    });
  }

  if (
    hasAgreedChange &&
    agreedDate &&
    !sameSchedule(historicalProposedDate, historicalProposedTime, agreedDate, agreedTime)
  ) {
    entries.push({
      id: 'agreed-schedule',
      role: 'agreed',
      date: agreedDate,
      time: agreedTime,
      state: 'accepted',
    });
  }

  return entries;
}

export function hasScheduleNegotiation(booking: ScheduleNegotiationFields): boolean {
  if (booking.status === 'pending_customer_acceptance' || booking.proposed_scheduled_date) {
    return true;
  }

  if (booking.last_proposed_scheduled_date || booking.schedule_proposed_at) {
    return true;
  }

  const history = buildScheduleHistory(booking);
  if (history.length > 1) {
    return true;
  }

  const requestedDate = booking.requested_scheduled_date ?? null;
  const requestedTime = normalizeTime(booking.requested_scheduled_time);
  const agreedDate = booking.scheduled_date ?? null;
  const agreedTime = normalizeTime(booking.scheduled_time);

  if (
    requestedDate &&
    agreedDate &&
    !sameSchedule(requestedDate, requestedTime, agreedDate, agreedTime)
  ) {
    return true;
  }

  return Boolean(booking.provider_notes?.trim() && booking.schedule_proposed_at);
}

/** Show timeline when there is negotiation history or provider schedule notes. */
export function shouldShowScheduleTimeline(booking: ScheduleNegotiationFields): boolean {
  if (hasScheduleNegotiation(booking)) {
    return true;
  }

  if (booking.provider_notes?.trim()) {
    return true;
  }

  const history = buildScheduleHistory(booking);
  if (history.length > 1) {
    return true;
  }

  const requestedDate =
    booking.requested_scheduled_date ?? booking.service_offer?.proposed_scheduled_date;
  const agreedDate = booking.scheduled_date ?? null;
  const requestedTime = normalizeTime(
    booking.requested_scheduled_time ?? booking.service_offer?.proposed_scheduled_time,
  );
  const agreedTime = normalizeTime(booking.scheduled_time);

  return Boolean(
    requestedDate &&
    agreedDate &&
    !sameSchedule(requestedDate, requestedTime, agreedDate, agreedTime),
  );
}

export function hasOriginalScheduleDifference(booking: ScheduleNegotiationFields): boolean {
  const requestedDate = booking.requested_scheduled_date ?? null;
  const requestedTime = normalizeTime(booking.requested_scheduled_time);

  if (!requestedDate || booking.status === 'pending_customer_acceptance') {
    return false;
  }

  const agreedDate = booking.scheduled_date ?? null;
  const agreedTime = normalizeTime(booking.scheduled_time);

  return !sameSchedule(requestedDate, requestedTime, agreedDate, agreedTime);
}

export function formatScheduleSlot(date?: string | null, time?: string | null): string {
  if (!date) {
    return '—';
  }
  const normalizedTime = normalizeTime(time);
  return normalizedTime ? `${date} · ${normalizedTime}` : date;
}

export function resolveAppointmentDisplay(booking: ScheduleNegotiationFields): {
  date: string;
  time: string;
  isNegotiating: boolean;
  originalDate: string;
  originalTime: string;
  showOriginal: boolean;
} {
  const originalDate = booking.requested_scheduled_date ?? booking.scheduled_date ?? '—';
  const originalTime =
    normalizeTime(booking.requested_scheduled_time ?? booking.scheduled_time) ?? '—';
  const isNegotiating = booking.status === 'pending_customer_acceptance';

  if (isNegotiating) {
    return {
      date: originalDate,
      time: originalTime,
      isNegotiating: true,
      originalDate,
      originalTime,
      showOriginal: false,
    };
  }

  const date = booking.scheduled_date ?? '—';
  const time = normalizeTime(booking.scheduled_time) ?? '—';
  const showOriginal = hasOriginalScheduleDifference({
    ...booking,
    scheduled_date: booking.scheduled_date,
    scheduled_time: booking.scheduled_time,
  });

  return {
    date,
    time,
    isNegotiating: false,
    originalDate,
    originalTime,
    showOriginal,
  };
}
