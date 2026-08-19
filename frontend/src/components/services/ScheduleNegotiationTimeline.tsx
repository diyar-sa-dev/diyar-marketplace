import React from 'react';
import { ArrowDown, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import {
  buildScheduleHistory,
  formatScheduleSlot,
  type ScheduleHistoryEntry,
  type ScheduleNegotiationFields,
} from '../../lib/scheduleNegotiation.ts';

type TranslateFn = (key: string) => string;

function roleLabel(entry: ScheduleHistoryEntry, label: (key: string) => string): string {
  switch (entry.role) {
    case 'customer':
      return label('customerRequestedSchedule');
    case 'provider':
      return label('providerProposedSchedule');
    case 'agreed':
      return label('agreedSchedule');
    default:
      return '';
  }
}

function stateBadge(entry: ScheduleHistoryEntry, label: (key: string) => string): string | null {
  switch (entry.state) {
    case 'active':
      return label('negotiationActive');
    case 'accepted':
      return label('negotiationAccepted');
    case 'superseded':
      return label('negotiationSuperseded');
    default:
      return null;
  }
}

function roleIcon(entry: ScheduleHistoryEntry) {
  if (entry.role === 'customer') {
    return <UserRound size={16} />;
  }
  if (entry.role === 'provider') {
    return <Clock3 size={16} />;
  }
  return <CheckCircle2 size={16} />;
}

export function ScheduleNegotiationTimeline({
  booking,
  t,
  providerNotesTitle,
  translationPrefix = 'providerDashboard.bookings',
  embedded = false,
}: {
  booking: ScheduleNegotiationFields;
  t: TranslateFn;
  providerNotesTitle?: string;
  translationPrefix?: string;
  embedded?: boolean;
}) {
  const entries = buildScheduleHistory(booking);
  const notes = booking.provider_notes?.trim();
  const label = (key: string) => t(`${translationPrefix}.${key}`);

  if (entries.length === 0 && !notes) {
    return null;
  }

  const wrapperClass = embedded
    ? 'space-y-4'
    : 'bg-white rounded-2xl border border-violet-100 shadow-sm p-6 space-y-4';

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <div>
          <h3 className="font-bold text-diyar-dark">{label('negotiationTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1">{label('negotiationSubtitle')}</p>
        </div>
      ) : entries.length > 0 || notes ? (
        <div>
          <h4 className="font-bold text-diyar-dark text-sm">{label('negotiationTitle')}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{label('negotiationSubtitle')}</p>
        </div>
      ) : null}

      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const badge = stateBadge(entry, label);
            const isProvider = entry.role === 'provider';
            const isAgreed = entry.role === 'agreed';

            return (
              <React.Fragment key={entry.id}>
                {index > 0 && (
                  <div className="flex justify-center text-violet-300">
                    <ArrowDown size={16} />
                  </div>
                )}
                <div
                  className={`rounded-xl border p-4 ${
                    isProvider
                      ? 'border-violet-100 bg-violet-50/60'
                      : isAgreed
                        ? 'border-green-100 bg-green-50/60'
                        : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isProvider
                            ? 'bg-violet-100 text-violet-700'
                            : isAgreed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-white text-gray-600 border border-gray-100'
                        }`}
                      >
                        {roleIcon(entry)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{roleLabel(entry, label)}</p>
                        <p className="font-bold text-diyar-dark" dir="ltr">
                          {formatScheduleSlot(entry.date, entry.time)}
                        </p>
                      </div>
                    </div>
                    {badge ? (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          entry.state === 'active'
                            ? 'bg-violet-100 text-violet-700'
                            : entry.state === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {notes ? (
        <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
          <p className="text-xs text-gray-500 mb-1">
            {providerNotesTitle ?? label('providerScheduleNotes')}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      ) : null}
    </div>
  );
}
