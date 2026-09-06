import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  X,
  Loader2,
  MessageSquare,
  Briefcase,
  FileText,
  Smartphone,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { ProviderBookingCardSkeleton } from '../../components/provider/ProviderBookingCardSkeleton.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { buildWhatsAppUrl, formatInternationalPhone } from '../../lib/whatsapp.ts';
import {
  useProviderBookingActions,
  useProviderBookings,
} from '../../hooks/provider/useProviderDashboard.ts';
import {
  formatBookingDisplayDate,
  formatBookingDisplayTime,
  formatWesternNumber,
  mapProviderBookingUiStatus,
} from '../../lib/providerDashboardUi.ts';
import type { ProviderBooking } from '../../types/providerDashboard.ts';
import { parseApiError, collectDisplayErrors } from '../../utils/errors.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import { BookingScheduleSection } from '../../components/services/BookingScheduleSection.tsx';
import { canProviderCancelBooking } from '../../lib/providerBookingRules.ts';
import { hasScheduleNegotiation } from '../../lib/scheduleNegotiation.ts';
import { useToast } from '../../hooks/useToast.ts';

type BookingUiStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled';

type BookingView = ProviderBooking & { uiStatus: BookingUiStatus };

type ModalAction = 'cancel' | 'complete' | null;

const todayIso = new Date().toISOString().slice(0, 10);

function formatBookingListDate(booking: ProviderBooking): string {
  if (booking.status === 'pending_customer_acceptance' && booking.proposed_scheduled_date) {
    return booking.proposed_scheduled_date;
  }
  return formatBookingDisplayDate(booking);
}

function formatBookingListTime(booking: ProviderBooking): string {
  if (booking.status === 'pending_customer_acceptance' && booking.proposed_scheduled_time) {
    return formatScheduleTime(booking.proposed_scheduled_time);
  }
  return formatBookingDisplayTime(booking);
}

function formatScheduleTime(value?: string | null): string {
  if (!value) {
    return '—';
  }
  return value.slice(0, 5);
}

function ActionModal({
  open,
  title,
  description,
  confirmLabel,
  confirmClassName,
  isPending,
  onClose,
  onConfirm,
  dir,
  cancelLabel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dir: 'rtl' | 'ltr';
  cancelLabel: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        dir={dir}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-xl text-diyar-dark">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`px-5 py-2.5 rounded-xl font-bold text-white transition disabled:opacity-60 flex items-center gap-2 cursor-pointer ${confirmClassName}`}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceBookings() {
  const { t, dir, locale } = useLocale();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight')?.trim() || null;
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const [activeTab, setActiveTab] = useState(highlightId ? 'pending' : 'upcoming');
  const [searchInput, setSearchInput] = useState('');
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 9 });
  const [selectedBooking, setSelectedBooking] = useState<BookingView | null>(null);
  const [bookingForModal, setBookingForModal] = useState<BookingView | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('10:00');
  const [providerNotes, setProviderNotes] = useState('');
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const highlightOpenedRef = useRef<string | null>(null);
  const highlightTriedAllRef = useRef(false);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const statusFilter =
    activeTab === 'all'
      ? undefined
      : (activeTab as 'pending' | 'upcoming' | 'completed' | 'cancelled');

  const { data, isLoading, isError, error, refetch } = useProviderBookings({
    page,
    per_page: perPage,
    status: statusFilter,
    q: debouncedSearch.trim() || undefined,
  });

  const { start, complete, cancel, confirm, proposeSchedule } = useProviderBookingActions();

  const bookings = useMemo<BookingView[]>(() => {
    return (data?.items ?? []).map((booking) => ({
      ...booking,
      uiStatus: mapProviderBookingUiStatus(booking),
    }));
  }, [data?.items]);

  useEffect(() => {
    if (!selectedBooking) {
      return;
    }
    const fresh = bookings.find((booking) => booking.id === selectedBooking.id);
    if (fresh) {
      setSelectedBooking(fresh);
    }
  }, [bookings, selectedBooking?.id]);

  useEffect(() => {
    if (!highlightId) {
      highlightOpenedRef.current = null;
      highlightTriedAllRef.current = false;
      return;
    }

    if (isLoading) {
      return;
    }

    const match = bookings.find((booking) => booking.id === highlightId);
    if (match) {
      if (highlightOpenedRef.current !== highlightId) {
        highlightOpenedRef.current = highlightId;
        setSelectedBooking(match);
      }
      return;
    }

    if (activeTab !== 'all' && !highlightTriedAllRef.current) {
      highlightTriedAllRef.current = true;
      setActiveTab('all');
      resetPage();
    }
  }, [highlightId, bookings, isLoading, activeTab, resetPage]);

  const getStatusBadge = (status: BookingUiStatus, bookingStatus?: ProviderBooking['status']) => {
    if (bookingStatus === 'pending_customer_acceptance') {
      return (
        <span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-bold border border-violet-200">
          {t('providerDashboard.bookings.status.negotiating')}
        </span>
      );
    }

    const label = t(`providerDashboard.bookings.status.${status}`);
    switch (status) {
      case 'upcoming':
        return (
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            {label}
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            {label}
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
            {label}
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            {label}
          </span>
        );
      default:
        return (
          <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const serviceLabel = (booking: BookingView) =>
    booking.service_title ??
    booking.service_request?.title ??
    t('providerDashboard.common.service');

  const handleComplete = async (booking: BookingView) => {
    setActionError(null);
    try {
      if (booking.status === 'confirmed') {
        await start.mutateAsync(booking.id);
      }
      await complete.mutateAsync(booking.id);
      setSelectedBooking(null);
      setBookingForModal(null);
      setModalAction(null);
      void refetch();
    } catch (mutationError) {
      setActionError(parseApiError(mutationError, locale).message);
    }
  };

  const handleCancel = async (booking: BookingView) => {
    setActionError(null);
    try {
      await cancel.mutateAsync(booking.id);
      toast.success(t('providerDashboard.bookings.cancelModal.success'));
      setSelectedBooking(null);
      setBookingForModal(null);
      setModalAction(null);
      void refetch();
    } catch (mutationError) {
      const message = parseApiError(mutationError, locale).message;
      setActionError(message);
      toast.error(message || t('providerDashboard.bookings.cancelModal.error'));
    }
  };

  const isActionPending =
    start.isPending ||
    complete.isPending ||
    cancel.isPending ||
    confirm.isPending ||
    proposeSchedule.isPending;
  const activeModalBooking = bookingForModal ?? (modalAction ? selectedBooking : null);

  const handleConfirm = async (booking: BookingView) => {
    setActionError(null);
    try {
      await confirm.mutateAsync(booking.id);
      toast.success(t('providerDashboard.bookings.confirmSuccess'));
      setSelectedBooking(null);
      void refetch();
    } catch (mutationError) {
      const message = parseApiError(mutationError, locale).message;
      setActionError(message);
      toast.error(message);
    }
  };

  const handleProposeSchedule = async (booking: BookingView) => {
    if (!proposedDate || !proposedTime) {
      toast.error(t('directBooking.scheduleRequired'));
      return;
    }
    if (proposedDate < todayIso) {
      const message = t('providerDashboard.bookings.proposeDatePastError');
      setActionError(message);
      toast.error(message);
      return;
    }
    setActionError(null);
    try {
      const updated = await proposeSchedule.mutateAsync({
        bookingId: booking.id,
        payload: {
          proposed_scheduled_date: proposedDate,
          proposed_scheduled_time: proposedTime,
          provider_notes: providerNotes.trim() || undefined,
        },
      });
      toast.success(t('providerDashboard.bookings.proposeSuccess'));
      setShowRescheduleForm(false);
      setSelectedBooking({ ...updated, uiStatus: mapProviderBookingUiStatus(updated) });
      void refetch();
    } catch (mutationError) {
      const { message } = collectDisplayErrors(mutationError, locale);
      setActionError(message);
      toast.error(message);
    }
  };

  const openModal = (booking: BookingView, action: ModalAction, fromDetail = false) => {
    if (fromDetail) {
      setSelectedBooking(booking);
    } else {
      setBookingForModal(booking);
    }
    setModalAction(action);
  };

  const closeModal = () => {
    setModalAction(null);
    setBookingForModal(null);
  };

  if (selectedBooking) {
    const customerName = selectedBooking.customer?.name ?? t('providerDashboard.common.client');
    const customerPhone = selectedBooking.customer?.phone?.trim() || null;
    const customerEmail = selectedBooking.customer?.email?.trim() || null;
    const customerNotes = selectedBooking.customer_notes?.trim() || null;
    const service = selectedBooking.service;
    const serviceRequest = selectedBooking.service_request;
    const whatsappUrl = customerPhone
      ? buildWhatsAppUrl(
          customerPhone,
          t('providerDashboard.bookings.whatsappPrefill', {
            name: customerName,
            reference: selectedBooking.reference,
            service: serviceLabel(selectedBooking),
          }),
        )
      : null;
    return (
      <div className="space-y-6 animate-in fade-in duration-300" dir={dir}>
        <ActionModal
          open={modalAction === 'cancel'}
          title={t('providerDashboard.bookings.cancelModal.title')}
          description={t('providerDashboard.bookings.cancelModal.description')}
          confirmLabel={t('providerDashboard.bookings.cancelModal.confirm')}
          confirmClassName="bg-red-600 hover:bg-red-700"
          isPending={cancel.isPending}
          onClose={closeModal}
          onConfirm={() => activeModalBooking && void handleCancel(activeModalBooking)}
          dir={dir}
          cancelLabel={t('providerDashboard.common.cancel')}
        />
        <ActionModal
          open={modalAction === 'complete'}
          title={t('providerDashboard.bookings.completeModal.title')}
          description={t('providerDashboard.bookings.completeModal.description')}
          confirmLabel={t('providerDashboard.bookings.completeModal.confirm')}
          confirmClassName="bg-green-600 hover:bg-green-700"
          isPending={isActionPending}
          onClose={closeModal}
          onConfirm={() => activeModalBooking && void handleComplete(activeModalBooking)}
          dir={dir}
          cancelLabel={t('providerDashboard.common.cancel')}
        />

        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="p-2 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <BackIcon size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-diyar-dark">
                {t('providerDashboard.bookings.detailTitle', {
                  reference: selectedBooking.reference,
                })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{serviceLabel(selectedBooking)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {selectedBooking.status === 'pending_provider_confirmation' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleConfirm(selectedBooking)}
                  disabled={isActionPending}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm cursor-pointer disabled:opacity-70"
                >
                  {t('providerDashboard.bookings.confirmBooking')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRescheduleForm((prev) => !prev)}
                  className="px-4 py-2 text-sm font-bold text-diyar-dark bg-gray-100 rounded-xl hover:bg-gray-200 transition shadow-sm cursor-pointer"
                >
                  {t('providerDashboard.bookings.proposeSchedule')}
                </button>
              </>
            )}
            {canProviderCancelBooking(selectedBooking) && (
              <button
                type="button"
                onClick={() => openModal(selectedBooking, 'cancel', true)}
                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition shadow-sm cursor-pointer"
              >
                {t('providerDashboard.bookings.reject')}
              </button>
            )}
            {selectedBooking.uiStatus === 'upcoming' && (
              <button
                type="button"
                onClick={() => openModal(selectedBooking, 'complete', true)}
                disabled={isActionPending}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                <CheckCircle size={16} />
                {t('providerDashboard.bookings.completeService')}
              </button>
            )}
          </div>
        </div>

        {selectedBooking.status === 'pending_provider_confirmation' && (
          <p className="text-sm text-sky-700 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
            {t('providerDashboard.bookings.awaitingConfirmationHint')}
          </p>
        )}

        {showRescheduleForm && selectedBooking.status === 'pending_provider_confirmation' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-diyar-dark">
              {t('providerDashboard.bookings.proposeSchedule')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
            </div>
            <p className="text-xs text-gray-500">
              {t('providerDashboard.bookings.proposeDateMinHint')}
            </p>
            <textarea
              rows={3}
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder={t('providerDashboard.bookings.providerNotesPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-y"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleProposeSchedule(selectedBooking)}
                disabled={isActionPending}
                className="bg-diyar-dark text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer disabled:opacity-60"
              >
                {t('providerDashboard.bookings.sendProposal')}
              </button>
              <button
                type="button"
                onClick={() => setShowRescheduleForm(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                {t('providerDashboard.common.cancel')}
              </button>
            </div>
          </div>
        )}

        {selectedBooking.status === 'pending_customer_acceptance' && (
          <p className="text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            {t('providerDashboard.bookings.awaitingCustomerResponse')}
          </p>
        )}

        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {actionError}
          </p>
        )}

        {selectedBooking.uiStatus === 'pending' && selectedBooking.status === 'pending_payment' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            {t('providerDashboard.bookings.pendingPaymentHint')}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BookingScheduleSection
              booking={selectedBooking}
              t={t}
              location={selectedBooking.location}
            />

            {service && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-diyar-dark mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-600" />
                  {t('providerDashboard.bookings.serviceDetailsTitle')}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt=""
                      className="w-full sm:w-32 h-32 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-3 text-sm">
                    <div>
                      <p className="font-bold text-diyar-dark text-base">{service.title}</p>
                      {service.pricing_label && (
                        <p className="text-blue-600 font-semibold mt-1">{service.pricing_label}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.category?.name && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-600/15">
                          {service.category.name}
                        </span>
                      )}
                      {service.service_type_label && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                          {service.service_type_label}
                        </span>
                      )}
                      {service.duration_label && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                          {t('providerDashboard.common.duration')}: {service.duration_label}
                        </span>
                      )}
                    </div>
                    {service.description?.trim() && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('providerDashboard.bookings.serviceDescription')}
                        </p>
                        <p className="text-gray-700 leading-relaxed">{service.description}</p>
                      </div>
                    )}
                    {service.slug && (
                      <Link
                        to={`/service/${service.slug}`}
                        className="inline-flex text-sm font-bold text-blue-600 hover:text-diyar-dark"
                      >
                        {t('providerDashboard.bookings.viewServicePage')} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {serviceRequest && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-diyar-dark mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  {t('providerDashboard.bookings.requestDetailsTitle')}
                </h3>
                <div className="space-y-3 text-sm">
                  {serviceRequest.reference && (
                    <p className="text-xs text-gray-400 font-semibold tracking-wide">
                      {t('providerDashboard.bookings.requestReference')}: {serviceRequest.reference}
                    </p>
                  )}
                  <p className="font-bold text-diyar-dark">{serviceRequest.title}</p>
                  {serviceRequest.description?.trim() && (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {serviceRequest.description}
                    </p>
                  )}
                  {(serviceRequest.budget_min != null || serviceRequest.budget_max != null) && (
                    <p className="text-gray-600">
                      {t('providerDashboard.common.budgetLabel')}{' '}
                      {serviceRequest.budget_min != null && serviceRequest.budget_max != null
                        ? `${serviceRequest.budget_min} – ${serviceRequest.budget_max} ${t('providerDashboard.common.currency')}`
                        : serviceRequest.budget_max != null
                          ? `${serviceRequest.budget_max} ${t('providerDashboard.common.currency')}`
                          : `${serviceRequest.budget_min} ${t('providerDashboard.common.currency')}`}
                    </p>
                  )}
                  {serviceRequest.location && (
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-600 shrink-0" />
                      {serviceRequest.location}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                {t('providerDashboard.bookings.customerNotesTitle')}
              </h3>
              <div className="bg-linear-to-br from-gray-50 to-diyar-cream/20 p-5 rounded-xl text-sm leading-relaxed text-gray-700 border border-gray-100">
                {customerNotes ?? (
                  <span className="text-gray-400 italic">
                    {t('providerDashboard.common.noNotes')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-linear-to-br from-white to-diyar-cream/20">
                <h3 className="font-bold text-diyar-dark mb-4">
                  {t('providerDashboard.bookings.customerInfoTitle')}
                </h3>
                <div className="flex items-center gap-4">
                  <UserAvatar name={customerName} size="md" />
                  <div>
                    <h4 className="font-bold text-diyar-dark">{customerName}</h4>
                    <p className="text-xs text-gray-500">
                      {t('providerDashboard.bookings.platformCustomer')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <Phone size={18} className="text-blue-600 shrink-0" />
                  {customerPhone ? (
                    <a
                      href={`tel:${customerPhone}`}
                      className="text-sm font-medium text-diyar-dark hover:text-blue-600"
                      dir="ltr"
                    >
                      {formatInternationalPhone(customerPhone)}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">
                      {t('providerDashboard.bookings.contactUnavailable')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <Mail size={18} className="text-blue-600 shrink-0" />
                  {customerEmail ? (
                    <a
                      href={`mailto:${customerEmail}`}
                      className="text-sm font-medium text-diyar-dark hover:text-blue-600 truncate"
                    >
                      {customerEmail}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">
                      {t('providerDashboard.bookings.contactUnavailable')}
                    </span>
                  )}
                </div>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-3.5 bg-green-50 text-green-700 rounded-xl border border-green-200 font-bold text-sm hover:bg-green-100 transition"
                  >
                    <Smartphone size={18} />
                    {t('providerDashboard.bookings.whatsappChat')}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center">
              <div className="p-6 border-b border-gray-100">
                <div className="text-gray-500 mb-2 text-sm">
                  {t('providerDashboard.bookings.statusLabel')}
                </div>
                <div className="inline-block">
                  {getStatusBadge(selectedBooking.uiStatus, selectedBooking.status)}
                </div>
              </div>
              <div className="p-6 bg-linear-to-br from-blue-50/80 to-white flex flex-col justify-center items-center">
                <div className="text-gray-500 mb-1 text-sm">
                  {t('providerDashboard.bookings.totalPrice')}
                </div>
                <div className="font-bold text-3xl text-blue-600 tabular-nums" dir="ltr">
                  {formatWesternNumber(Number(selectedBooking.price))}{' '}
                  <span className="text-lg text-blue-600/70">
                    {t('providerDashboard.common.currency')}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  {selectedBooking.uiStatus === 'pending'
                    ? t('providerDashboard.common.pendingCustomerPayment')
                    : t('providerDashboard.bookings.paymentEscrow')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.bookings.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('providerDashboard.bookings.subtitle')}</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t('providerDashboard.bookings.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
            className="ps-10 pe-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full md:w-64"
          />
          <Search size={18} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'all', label: t('providerDashboard.bookings.tabs.all') },
          { id: 'pending', label: t('providerDashboard.bookings.tabs.pendingConfirm') },
          { id: 'upcoming', label: t('providerDashboard.bookings.tabs.upcomingBookings') },
          { id: 'completed', label: t('providerDashboard.bookings.tabs.completed') },
          { id: 'cancelled', label: t('providerDashboard.bookings.tabs.cancelled') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              resetPage();
            }}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState
          message={t('providerDashboard.bookings.loadError')}
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: perPage }).map((_, index) => (
            <ProviderBookingCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-600/20 transition-all overflow-hidden"
              >
                <div className="p-5 border-b border-gray-50 bg-linear-to-br from-white to-diyar-cream/15">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        {booking.reference}
                      </span>
                      <h3 className="font-bold text-diyar-dark mt-0.5 line-clamp-1">
                        {serviceLabel(booking)}
                      </h3>
                    </div>
                    {getStatusBadge(booking.uiStatus, booking.status)}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={booking.customer?.name} size="sm" />
                    <p className="text-sm text-gray-600 truncate">
                      {booking.customer?.name ?? t('providerDashboard.common.client')}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <CalendarIcon size={16} className="text-blue-600 shrink-0" />
                    <span dir="ltr">{formatBookingListDate(booking)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <Clock size={16} className="text-blue-600 shrink-0" />
                    <span dir="ltr">{formatBookingListTime(booking)}</span>
                  </div>
                  {hasScheduleNegotiation(booking) && (
                    <p className="text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5">
                      {t('providerDashboard.bookings.listProposedSchedule', {
                        date:
                          booking.proposed_scheduled_date ??
                          booking.last_proposed_scheduled_date ??
                          '—',
                        time: formatScheduleTime(
                          booking.proposed_scheduled_time ?? booking.last_proposed_scheduled_time,
                        ),
                      })}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <MapPin size={16} className="text-blue-600 shrink-0" />
                    <span className="truncate">{booking.location ?? '—'}</span>
                  </div>
                  <div className="pt-2 flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-500">
                      {t('providerDashboard.bookings.price')}
                    </span>
                    <span className="font-bold text-blue-600 tabular-nums" dir="ltr">
                      {formatWesternNumber(Number(booking.price))}{' '}
                      {t('providerDashboard.common.currency')}
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-diyar-dark py-2 rounded-xl text-sm font-bold transition cursor-pointer"
                  >
                    {t('providerDashboard.bookings.detailsButton')}
                  </button>
                  {canProviderCancelBooking(booking) && (
                    <button
                      type="button"
                      onClick={() => openModal(booking, 'cancel')}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition cursor-pointer"
                    >
                      {t('providerDashboard.bookings.rejectShort')}
                    </button>
                  )}
                  {booking.uiStatus === 'upcoming' && (
                    <button
                      type="button"
                      onClick={() => openModal(booking, 'complete')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      {t('providerDashboard.bookings.startService')}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {bookings.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                {t('providerDashboard.bookings.empty')}
              </div>
            )}
          </div>

          {data?.pagination && (
            <PaginationBar
              pagination={data.pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...perPageOptions]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              alwaysShow={data.pagination.total > 0}
              className="mt-4"
            />
          )}

          <ActionModal
            open={Boolean(bookingForModal && modalAction === 'cancel')}
            title={t('providerDashboard.bookings.cancelModal.title')}
            description={t('providerDashboard.bookings.cancelModal.description')}
            confirmLabel={t('providerDashboard.bookings.cancelModal.confirm')}
            confirmClassName="bg-red-600 hover:bg-red-700"
            isPending={cancel.isPending}
            onClose={closeModal}
            onConfirm={() => bookingForModal && void handleCancel(bookingForModal)}
            dir={dir}
            cancelLabel={t('providerDashboard.common.cancel')}
          />
          <ActionModal
            open={Boolean(bookingForModal && modalAction === 'complete')}
            title={t('providerDashboard.bookings.completeModal.title')}
            description={t('providerDashboard.bookings.completeModal.description')}
            confirmLabel={t('providerDashboard.bookings.completeModal.confirm')}
            confirmClassName="bg-green-600 hover:bg-green-700"
            isPending={isActionPending}
            onClose={closeModal}
            onConfirm={() => bookingForModal && void handleComplete(bookingForModal)}
            dir={dir}
            cancelLabel={t('providerDashboard.common.cancel')}
          />
        </>
      )}
    </div>
  );
}
