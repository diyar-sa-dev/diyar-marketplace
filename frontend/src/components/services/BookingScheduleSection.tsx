import React from 'react';
import { Calendar, Clock, History, MapPin } from 'lucide-react';
import {
  resolveAppointmentDisplay,
  shouldShowScheduleTimeline,
  type ScheduleNegotiationFields,
} from '../../lib/scheduleNegotiation.ts';
import { ScheduleNegotiationTimeline } from './ScheduleNegotiationTimeline.tsx';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type BookingScheduleSectionProps = {
  booking: ScheduleNegotiationFields & { location?: string | null };
  t: TranslateFn;
  translationPrefix?: string;
  location?: string | null;
};

export function BookingScheduleSection({
  booking,
  t,
  translationPrefix = 'providerDashboard.bookings',
  location,
}: BookingScheduleSectionProps) {
  const label = (key: string) => t(`${translationPrefix}.${key}`);
  const appointment = resolveAppointmentDisplay(booking);
  const resolvedLocation = location ?? booking.location ?? '—';
  const showTimeline = shouldShowScheduleTimeline(booking);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-linear-to-r from-diyar-dark via-diyar-brown/90 to-diyar-brown px-6 py-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-white">{label('serviceAppointmentTitle')}</h3>
        {showTimeline && hasScheduleHistoryContent(booking) ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/90 bg-white/15 px-2.5 py-1 rounded-full">
            <History size={12} />
            {label('negotiationTitle')}
          </span>
        ) : null}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-linear-to-br from-blue-50 to-white border border-blue-100/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <Calendar size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">
                {appointment.isNegotiating
                  ? label('originalAppointmentDate')
                  : label('appointmentDate')}
              </p>
              <p className="font-bold text-diyar-dark text-lg" dir="ltr">
                {appointment.date}
              </p>
              {appointment.isNegotiating ? (
                <p className="text-[11px] text-violet-600 mt-1 leading-relaxed">
                  {label('appointmentDuringNegotiationHint')}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-linear-to-br from-purple-50 to-white border border-purple-100/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
              <Clock size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{label('reservedTime')}</p>
              <p className="font-bold text-diyar-dark text-lg" dir="ltr">
                {appointment.time}
              </p>
            </div>
          </div>
        </div>

        {appointment.showOriginal && !appointment.isNegotiating ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-xs font-bold text-violet-700">
              {label('originalRequestedSchedule')}
            </p>
            <p className="text-sm font-bold text-diyar-dark" dir="ltr">
              {appointment.originalDate} · {appointment.originalTime}
            </p>
            <span className="text-[11px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
              {label('negotiationSuperseded')}
            </span>
          </div>
        ) : null}

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-linear-to-br from-amber-50 to-white border border-amber-100/80">
          <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
            <MapPin size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">{label('serviceLocation')}</p>
            <p className="font-bold text-diyar-dark leading-relaxed">{resolvedLocation}</p>
          </div>
        </div>

        {showTimeline ? (
          <div className="pt-2 border-t border-gray-100">
            <ScheduleNegotiationTimeline
              booking={booking}
              t={t}
              translationPrefix={translationPrefix}
              embedded
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function hasScheduleHistoryContent(booking: ScheduleNegotiationFields): boolean {
  return (
    Boolean(booking.last_proposed_scheduled_date) ||
    Boolean(booking.proposed_scheduled_date) ||
    booking.status === 'pending_customer_acceptance' ||
    Boolean(booking.provider_notes?.trim())
  );
}
