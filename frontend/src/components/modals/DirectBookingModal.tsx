import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Loader2, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StarRating } from '../product/StarRating.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import {
  useCreateDirectBooking,
  useDirectBookingPayment,
  useDirectBookingPreview,
} from '../../hooks/services/useServiceBookings.ts';
import { useSubmitProviderReview } from '../../hooks/provider/useProviderReviews.ts';
import { validateStoreReviewInput, MAX_COMMENT_LENGTH } from '../../lib/storeReviewValidation.ts';
import {
  clampTimeToMin,
  defaultBookingTimeForDate,
  formatBookingScheduleDate,
  formatBookingScheduleTime,
  localIsoDate,
  maxBookingIsoDate,
  minTimeForDate,
  validateDirectBookingSchedule,
} from '../../lib/directBookingSchedule.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ServiceDetail } from '../../types/services.ts';

interface DirectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDetail;
}

type Step = 'form' | 'preview' | 'awaiting' | 'payment' | 'success';

export function DirectBookingModal({ isOpen, onClose, service }: DirectBookingModalProps) {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [location, setLocation] = useState(service.location ?? '');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const previewMutation = useDirectBookingPreview(service.slug);
  const createMutation = useCreateDirectBooking(service.slug);
  const paymentMutation = useDirectBookingPayment();

  const preview = previewMutation.data;

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setScheduledDate('');
      setScheduledTime('');
      setScheduleError(null);
      setCustomerNotes('');
      setLocation(service.location ?? '');
      setBookingId(null);
      previewMutation.reset();
      createMutation.reset();
      paymentMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, service.id]);

  const providerName = service.provider?.display_name ?? '';
  const priceLabel = useMemo(() => {
    if (preview) {
      return `${preview.price} ${preview.currency}`;
    }
    return service.pricing_label ?? `${service.starting_price ?? '—'} ${service.currency}`;
  }, [preview, service]);

  if (!isOpen) {
    return null;
  }

  const minDate = localIsoDate();
  const maxDate = maxBookingIsoDate();
  const minTime = scheduledDate ? minTimeForDate(scheduledDate) : undefined;

  const handlePreview = async () => {
    const validationKey = validateDirectBookingSchedule(scheduledDate, scheduledTime);
    if (validationKey) {
      setScheduleError(t(validationKey));
      toast.error(t(validationKey));
      return;
    }
    setScheduleError(null);

    try {
      await previewMutation.mutateAsync({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        location: location.trim() || undefined,
        customer_notes: customerNotes.trim() || undefined,
      });
      setStep('preview');
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleCreateBooking = async () => {
    try {
      const booking = await createMutation.mutateAsync({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        location: location.trim() || undefined,
        customer_notes: customerNotes.trim() || undefined,
        idempotency_key: idempotencyKey,
      });
      setBookingId(booking.id);
      setStep('awaiting');
      toast.success(t('directBooking.awaitingProviderTitle'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handlePay = async (outcome: 'paid' | 'failed') => {
    if (!bookingId) {
      return;
    }

    try {
      await paymentMutation.mutateAsync({ bookingId, outcome });
      if (outcome === 'paid') {
        setStep('success');
        toast.success(t('directBooking.paymentSuccess'));
      } else {
        toast.error(t('directBooking.paymentFailed'));
      }
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const submitting =
    previewMutation.isPending || createMutation.isPending || paymentMutation.isPending;

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-diyar-dark truncate">{service.title}</h2>
            <p className="text-sm text-gray-500">{providerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'form' && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('directBooking.price')}</span>
                  <span className="font-bold text-diyar-dark">{priceLabel}</span>
                </div>
                {service.duration_label && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('directBooking.duration')}</span>
                    <span className="font-medium">{service.duration_label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} /> {t('directBooking.date')}
                </label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={scheduledDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setScheduledDate(nextDate);
                    setScheduleError(null);
                    if (nextDate) {
                      setScheduledTime((prev) =>
                        clampTimeToMin(nextDate, prev || defaultBookingTimeForDate(nextDate)),
                      );
                    } else {
                      setScheduledTime('');
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10"
                />
                <p className="mt-1.5 text-xs text-gray-400">{t('directBooking.scheduleHint')}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} /> {t('directBooking.time')}
                </label>
                <input
                  type="time"
                  min={minTime}
                  value={scheduledTime}
                  onChange={(e) => {
                    setScheduledTime(e.target.value);
                    setScheduleError(null);
                  }}
                  disabled={!scheduledDate}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {scheduleError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{scheduleError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} /> {t('directBooking.location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('directBooking.locationPlaceholder')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  {t('directBooking.notes')}
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder={t('directBooking.notesPlaceholder')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y"
                />
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handlePreview()}
                className="w-full bg-diyar-dark text-white font-bold py-3 rounded-xl hover:bg-black transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  t('directBooking.continue')
                )}
              </button>
            </>
          )}

          {step === 'preview' && preview && (
            <>
              <div className="bg-diyar-cream/30 rounded-xl p-4 border border-diyar-brown/10 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{t('directBooking.service')}</span>
                  <span className="font-bold text-end">{preview.service.title}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{t('directBooking.provider')}</span>
                  <span className="font-medium">{preview.provider.display_name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{t('directBooking.price')}</span>
                  <span className="font-bold text-diyar-brown">
                    {preview.price} {preview.currency}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{t('directBooking.date')}</span>
                  <span className="font-medium">
                    {preview.scheduled_date
                      ? formatBookingScheduleDate(preview.scheduled_date, locale)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">{t('directBooking.time')}</span>
                  <span className="font-medium">
                    {preview.scheduled_time
                      ? formatBookingScheduleTime(preview.scheduled_time, locale)
                      : '—'}
                  </span>
                </div>
                {preview.location && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">{t('directBooking.location')}</span>
                    <span className="font-medium text-end">{preview.location}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep('form')}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  {t('directBooking.back')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleCreateBooking()}
                  className="flex-1 bg-diyar-brown text-white font-bold py-3 rounded-xl hover:bg-orange-700 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    t('directBooking.confirmBooking')
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'awaiting' && (
            <>
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <Calendar size={28} />
                </div>
                <h3 className="font-bold text-diyar-dark text-lg">
                  {t('directBooking.awaitingProviderTitle')}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('directBooking.awaitingProviderMessage')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/orders?tab=bookings');
                }}
                className="w-full bg-diyar-dark text-white font-bold py-3 rounded-xl hover:bg-black cursor-pointer"
              >
                {t('directBooking.viewBookings')}
              </button>
            </>
          )}

          {step === 'payment' && bookingId && (
            <>
              <p className="text-sm text-gray-600">{t('directBooking.paymentHint')}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handlePay('paid')}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin mx-auto" />
                  ) : (
                    t('directBooking.simulatePaid')
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handlePay('failed')}
                  className="w-full border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                >
                  {t('directBooking.simulateFailed')}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <p className="text-center text-gray-600">{t('directBooking.successMessage')}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/orders?tab=bookings');
                }}
                className="w-full bg-diyar-dark text-white font-bold py-3 rounded-xl hover:bg-black cursor-pointer"
              >
                {t('directBooking.viewBookings')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProviderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle?: string;
  onSubmitted?: () => void;
}

export function ProviderReviewModal({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  onSubmitted,
}: ProviderReviewModalProps) {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const submitReview = useSubmitProviderReview(bookingId);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
    }
  }, [isOpen, bookingId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const validationError = validateStoreReviewInput(rating, comment.trim());
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    try {
      await submitReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(t('providerReviews.submitSuccess'));
      onSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-diyar-dark">{t('providerReviews.leaveReview')}</h3>
            {serviceTitle && <p className="text-sm text-gray-500 mt-1">{serviceTitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <StarRating value={rating} onChange={setRating} size={28} className="mb-4" />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={t('providerReviews.commentPlaceholder')}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y min-h-24"
        />

        <button
          type="button"
          disabled={submitReview.isPending}
          onClick={() => void handleSubmit()}
          className="w-full mt-4 bg-diyar-brown text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-60 cursor-pointer flex items-center justify-center"
        >
          {submitReview.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            t('providerReviews.submit')
          )}
        </button>
      </div>
    </div>
  );
}
