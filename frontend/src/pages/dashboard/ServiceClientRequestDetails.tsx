import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  DollarSign,
  Clock,
  Paperclip,
  Send,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { ProviderQuotationUpload } from '../../components/provider/ProviderQuotationUpload.tsx';
import {
  useProviderServiceRequest,
  useSubmitProviderServiceOffer,
} from '../../hooks/provider/useProviderDashboard.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  formatAttachmentSize,
  formatProviderBudget,
  formatProviderRequestDate,
  providerCategoryLabel,
} from '../../lib/providerDashboardUi.ts';
import {
  validateProviderOfferForm,
  type ProviderOfferFormErrors,
} from '../../lib/providerOfferValidation.ts';
import {
  clampTimeToMin,
  defaultBookingTimeForDate,
  localIsoDate,
  maxBookingIsoDate,
  minTimeForDate,
} from '../../lib/directBookingSchedule.ts';
import type { ServiceOffer } from '../../types/serviceRequests.ts';
import { parseApiError } from '../../utils/errors.ts';

const INPUT_CLASS =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-gray-400';

export default function ServiceClientRequestDetails() {
  const { id } = useParams();
  const { t, dir, locale } = useLocale();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const { data: request, isLoading, isError, error, refetch } = useProviderServiceRequest(id);
  const submitOffer = useSubmitProviderServiceOffer();

  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProviderOfferFormErrors>({});

  useEffect(() => {
    if (request?.provider_has_offer) {
      setIsSubmitted(true);
    }
  }, [request?.provider_has_offer]);

  useEffect(() => {
    if (isSubmitted) {
      return;
    }
    const today = localIsoDate();
    setScheduledDate(today);
    setScheduledTime(defaultBookingTimeForDate(today));
  }, [id, isSubmitted]);

  const submittedOffer: ServiceOffer | undefined = request?.offers?.[0];
  const minScheduleTime = scheduledDate ? minTimeForDate(scheduledDate) : undefined;

  const handlePriceChange = (value: string) => {
    const digitsOnly = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setOfferPrice(digitsOnly);
    if (fieldErrors.offerPrice) {
      setFieldErrors((prev) => ({ ...prev, offerPrice: undefined }));
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      return;
    }

    setSubmitError(null);
    const errors = validateProviderOfferForm({
      offerPrice,
      offerMessage,
      scheduledDate,
      scheduledTime,
      quotationFile,
      budgetMin: request?.budget_min,
      budgetMax: request?.budget_max,
      t,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const normalizedTime =
      scheduledDate && scheduledTime ? clampTimeToMin(scheduledDate, scheduledTime) : scheduledTime;
    if (normalizedTime !== scheduledTime) {
      setScheduledTime(normalizedTime);
    }

    try {
      await submitOffer.mutateAsync({
        requestId: id,
        payload: {
          proposed_price: Number(offerPrice),
          message: offerMessage.trim(),
          proposed_scheduled_date: scheduledDate || undefined,
          proposed_scheduled_time: normalizedTime || undefined,
          quotation: quotationFile ?? undefined,
        },
      });
      setIsSubmitted(true);
      void refetch();
    } catch (mutationError) {
      setSubmitError(parseApiError(mutationError, locale).message);
    }
  };

  const displayReference = request?.reference ?? id?.toUpperCase() ?? '';

  if (isLoading) {
    return (
      <div className="space-y-6" dir={dir}>
        <LoadingState className="min-h-96" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="space-y-6" dir={dir}>
        <ErrorState
          message={t('providerDashboard.clientRequestDetails.loadError')}
          error={error as Error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/service/client-requests"
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <BackIcon size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.clientRequestDetails.title', { reference: displayReference })}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('providerDashboard.clientRequestDetails.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg truncate">
                {providerCategoryLabel(request, locale)}
              </span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Clock size={16} /> {formatProviderRequestDate(request.created_at, locale)}
              </span>
            </div>

            <h2 className="text-xl font-bold text-diyar-dark mb-4">
              {request.title ||
                t('providerDashboard.clientRequestDetails.requestFrom', {
                  name: request.customer?.name ?? t('providerDashboard.common.client'),
                })}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
              {request.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {t('providerDashboard.common.location')}
                  </p>
                  <p className="font-bold text-gray-800">{request.location ?? '—'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {t('providerDashboard.clientRequestDetails.suggestedBudget')}
                  </p>
                  <p className="font-bold text-gray-800" dir="ltr">
                    {formatProviderBudget(request.budget_min, request.budget_max, locale)}
                  </p>
                </div>
              </div>
            </div>

            {(request.attachments?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                  <Paperclip size={20} className="text-gray-400" />
                  {t('providerDashboard.clientRequestDetails.attachmentsCount', {
                    count: request.attachments?.length ?? 0,
                  })}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {request.attachments?.map((file) => (
                    <a
                      key={file.id}
                      href={file.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                        <Paperclip size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">{file.original_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatAttachmentSize(file.size_bytes)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-diyar-dark mb-6">
              {t('providerDashboard.clientRequestDetails.submitOffer')}
            </h3>

            {isSubmitted ? (
              <div className="space-y-5">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    {t('providerDashboard.clientRequestDetails.offerSubmittedTitle')}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {t('providerDashboard.clientRequestDetails.offerSubmittedDescription')}
                  </p>
                </div>

                {submittedOffer ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {t('providerDashboard.clientRequestDetails.offerPrice')}
                      </p>
                      <p className="font-bold text-diyar-dark text-lg" dir="ltr">
                        {submittedOffer.proposed_price} {submittedOffer.currency}
                      </p>
                    </div>
                    {(submittedOffer.proposed_scheduled_date ||
                      submittedOffer.proposed_scheduled_time) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('providerDashboard.clientRequestDetails.scheduledDate')}
                        </p>
                        <p className="font-bold text-diyar-dark" dir="ltr">
                          {[
                            submittedOffer.proposed_scheduled_date,
                            submittedOffer.proposed_scheduled_time,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    )}
                    {submittedOffer.message?.trim() && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('providerDashboard.clientRequestDetails.offerMessage')}
                        </p>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {submittedOffer.message}
                        </p>
                      </div>
                    )}
                    {submittedOffer.duration_days != null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('serviceMarketplace.requests.executionDuration')}
                        </p>
                        <p className="font-bold text-diyar-dark">
                          {t('serviceMarketplace.requests.durationDays', {
                            count: submittedOffer.duration_days,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} className="space-y-5 flex-1 flex flex-col">
                <div>
                  <RequiredLabel required className="text-sm font-bold text-gray-700 mb-2">
                    {t('providerDashboard.clientRequestDetails.offerPrice')}
                  </RequiredLabel>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={offerPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder={t('providerDashboard.clientRequestDetails.priceExample')}
                    className={`${INPUT_CLASS} ${fieldErrors.offerPrice ? 'border-red-300 ring-red-100' : ''}`}
                    dir="ltr"
                    aria-invalid={Boolean(fieldErrors.offerPrice)}
                  />
                  <FieldError message={fieldErrors.offerPrice} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('providerDashboard.clientRequestDetails.scheduledDate')}
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type="date"
                        value={scheduledDate}
                        min={localIsoDate()}
                        max={maxBookingIsoDate()}
                        onChange={(e) => {
                          const nextDate = e.target.value;
                          setScheduledDate(nextDate);
                          if (nextDate && scheduledTime) {
                            setScheduledTime(clampTimeToMin(nextDate, scheduledTime));
                          } else if (nextDate) {
                            setScheduledTime(defaultBookingTimeForDate(nextDate));
                          }
                          setFieldErrors((prev) => ({
                            ...prev,
                            scheduledDate: undefined,
                            scheduledTime: undefined,
                          }));
                        }}
                        className={`${INPUT_CLASS} ps-9 ${fieldErrors.scheduledDate ? 'border-red-300' : ''}`}
                        dir="ltr"
                      />
                    </div>
                    <FieldError message={fieldErrors.scheduledDate} />
                    <p className="mt-1 text-xs text-gray-400">{t('directBooking.scheduleHint')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('providerDashboard.clientRequestDetails.scheduledTime')}
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      min={minScheduleTime}
                      onChange={(e) => {
                        const nextTime = scheduledDate
                          ? clampTimeToMin(scheduledDate, e.target.value)
                          : e.target.value;
                        setScheduledTime(nextTime);
                        setFieldErrors((prev) => ({ ...prev, scheduledTime: undefined }));
                      }}
                      className={`${INPUT_CLASS} ${fieldErrors.scheduledTime ? 'border-red-300' : ''}`}
                      dir="ltr"
                    />
                    <FieldError message={fieldErrors.scheduledTime} />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <RequiredLabel required className="text-sm font-bold text-gray-700 mb-2">
                    {t('providerDashboard.clientRequestDetails.offerMessage')}
                  </RequiredLabel>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => {
                      setOfferMessage(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, offerMessage: undefined }));
                    }}
                    placeholder={t(
                      'providerDashboard.clientRequestDetails.offerMessagePlaceholder',
                    )}
                    className={`w-full h-full min-h-30 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all resize-none placeholder:text-gray-400 ${fieldErrors.offerMessage ? 'border-red-300' : ''}`}
                  />
                  <FieldError message={fieldErrors.offerMessage} />
                </div>

                <ProviderQuotationUpload
                  file={quotationFile}
                  onChange={(file) => {
                    setQuotationFile(file);
                    setFieldErrors((prev) => ({ ...prev, quotation: undefined }));
                  }}
                  error={fieldErrors.quotation}
                  disabled={submitOffer.isPending}
                />

                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitOffer.isPending}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-auto cursor-pointer"
                >
                  {submitOffer.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent flex items-center justify-center rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {t('providerDashboard.clientRequestDetails.confirmSubmit')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
