import React, { useMemo, useState } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Filter,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import {
  useProviderBookingActions,
  useProviderBookings,
} from '../../hooks/provider/useProviderDashboard.ts';
import {
  formatBookingDisplayDate,
  formatBookingDisplayTime,
  mapProviderBookingUiStatus,
} from '../../lib/providerDashboardUi.ts';
import type { ProviderBooking } from '../../types/providerDashboard.ts';
import { parseApiError } from '../../utils/errors.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type BookingUiStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled';

type BookingView = ProviderBooking & { uiStatus: BookingUiStatus };

export default function ServiceBookings() {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingView | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useProviderBookings(1, 50);
  const { start, complete } = useProviderBookingActions();

  const bookings = useMemo<BookingView[]>(() => {
    return (data?.items ?? []).map((booking) => ({
      ...booking,
      uiStatus: mapProviderBookingUiStatus(booking),
    }));
  }, [data?.items]);

  const getFilteredBookings = () => {
    let filtered = bookings;
    if (activeTab !== 'all') {
      filtered = filtered.filter((booking) => booking.uiStatus === activeTab);
    }
    if (searchTerm) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((booking) => {
        const haystack = [
          booking.reference,
          booking.customer?.name,
          booking.service_title,
          booking.service_request?.title,
          booking.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    return filtered;
  };

  const getStatusBadge = (status: BookingUiStatus) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            قادم
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            مكتمل
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
            قيد المراجعة
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            ملغي
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
    booking.service_title ?? booking.service_request?.title ?? 'خدمة';

  const handleComplete = async (booking: BookingView) => {
    setActionError(null);
    try {
      if (booking.status === 'confirmed') {
        await start.mutateAsync(booking.id);
      }
      await complete.mutateAsync(booking.id);
      setSelectedBooking(null);
      void refetch();
    } catch (mutationError) {
      setActionError(parseApiError(mutationError, locale).message);
    }
  };

  const isActionPending = start.isPending || complete.isPending;

  if (selectedBooking) {
    const customerName = selectedBooking.customer?.name ?? 'عميل';
    const customerNotes =
      selectedBooking.customer_notes ??
      selectedBooking.service_request?.description ??
      'لا توجد ملاحظات إضافية من العميل حول هذا الحجز.';

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedBooking(null)}
              className="p-2 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 rounded-xl transition"
            >
              <ArrowRight size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-diyar-dark">
                تفاصيل الحجز {selectedBooking.reference}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{serviceLabel(selectedBooking)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedBooking.uiStatus === 'pending' && (
              <>
                <button
                  disabled
                  title="بانتظار دفع العميل"
                  className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl transition shadow-sm opacity-60 cursor-not-allowed"
                >
                  رفض الحجز
                </button>
                <button
                  disabled
                  title="بانتظار دفع العميل"
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl transition shadow-sm opacity-60 cursor-not-allowed"
                >
                  قبول الحجز
                </button>
              </>
            )}
            {selectedBooking.uiStatus === 'upcoming' && (
              <button
                onClick={() => void handleComplete(selectedBooking)}
                disabled={isActionPending}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                تعليم كمكتمل
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {actionError}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-6 border-b border-gray-100 pb-4">
                تفاصيل الخدمة والموعد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-0.5">تاريخ الموعد</p>
                      <p className="font-bold text-diyar-dark">
                        {formatBookingDisplayDate(selectedBooking)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-0.5">الوقت المحجوز</p>
                      <p className="font-bold text-diyar-dark">
                        {formatBookingDisplayTime(selectedBooking)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-0.5">موقع الخدمة</p>
                        <p className="font-bold text-diyar-dark leading-relaxed">
                          {selectedBooking.location ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-2">
                      <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                        عرض الموقع على الخريطة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-4">
                ملاحظات العميل
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl text-sm leading-relaxed text-gray-700 border border-gray-100">
                {customerNotes}
              </div>

              {selectedBooking.uiStatus === 'upcoming' && (
                <div className="mt-6">
                  <h4 className="font-bold text-gray-700 mb-3 text-sm">
                    إضافة ملاحظات (تظهر للعميل بعد إكمال الخدمة)
                  </h4>
                  <textarea
                    rows={3}
                    placeholder="اكتب ملاحظاتك وتوصياتك هنا..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                  ></textarea>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-4">
                معلومات العميل
              </h3>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                  {customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-diyar-dark">{customerName}</h4>
                  <p className="text-xs text-gray-500">عميل منصة ديار</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700" dir="ltr">
                    —
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">—</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center">
              <div className="p-6 border-b border-gray-100">
                <div className="text-gray-500 mb-2 text-sm">الحالة</div>
                <div className="inline-block">{getStatusBadge(selectedBooking.uiStatus)}</div>
              </div>
              <div className="p-6 bg-gray-50 flex flex-col justify-center items-center">
                <div className="text-gray-500 mb-1 text-sm">إجمالي السعر</div>
                <div className="font-bold text-3xl text-blue-600">
                  {selectedBooking.price}{' '}
                  <span className="text-lg text-blue-600/70">ر.س</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  {selectedBooking.uiStatus === 'pending'
                    ? 'بانتظار دفع العميل'
                    : 'الدفع عبر المنصة (محفوظ)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState className="min-h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState
          message="تعذر تحميل الحجوزات"
          error={error as Error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">إدارة الحجوزات</h2>
          <p className="text-gray-500 text-sm mt-1">
            عرض ومتابعة طلبات الحجوزات الخاصة بك وتحديث حالاتها.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن حجز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full md:w-64"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              <Filter size={20} />
            </button>
            {isFilterOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-2">
                <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">الخدمة</h4>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">
                  استشارة ميدانية
                </button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">
                  تصميم داخلي
                </button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">
                  تنسيق أثاث
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'بانتظار التأكيد' },
          { id: 'upcoming', label: 'الحجوزات القادمة' },
          { id: 'completed', label: 'مكتملة' },
          { id: 'cancelled', label: 'ملغاة' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs text-gray-500 mb-1 inline-block">{booking.reference}</span>
                <h3 className="font-bold text-diyar-dark">{serviceLabel(booking)}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{booking.customer?.name ?? 'عميل'}</p>
              </div>
              {getStatusBadge(booking.uiStatus)}
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarIcon size={16} className="text-gray-400" />
                <span>{formatBookingDisplayDate(booking)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} className="text-gray-400" />
                <span>{formatBookingDisplayTime(booking)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className="text-gray-400" />
                <span className="truncate">{booking.location ?? '—'}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setSelectedBooking(booking)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-diyar-dark py-2 rounded-xl text-sm font-bold transition"
              >
                التفاصيل
              </button>
              {booking.uiStatus === 'pending' && (
                <>
                  <button
                    disabled
                    title="بانتظار دفع العميل"
                    className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-bold transition opacity-60 cursor-not-allowed"
                  >
                    قبول
                  </button>
                  <button
                    disabled
                    title="بانتظار دفع العميل"
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-bold transition opacity-60 cursor-not-allowed"
                  >
                    رفض
                  </button>
                </>
              )}
              {booking.uiStatus === 'upcoming' && (
                <button
                  onClick={() => void handleComplete(booking)}
                  disabled={isActionPending}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  إكمال الخدمة
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            لا توجد حجوزات تطابق بحثك...
          </div>
        )}
      </div>
    </div>
  );
}
