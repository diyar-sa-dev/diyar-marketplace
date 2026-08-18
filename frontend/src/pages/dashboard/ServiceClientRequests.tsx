import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useProviderServiceRequests } from '../../hooks/provider/useProviderDashboard.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  formatProviderBudget,
  formatProviderRequestDate,
  providerCategoryLabel,
} from '../../lib/providerDashboardUi.ts';

export default function ServiceClientRequests() {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'open' | 'offered'>('open');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data, isLoading, isError, error, refetch } = useProviderServiceRequests({
    status: activeTab === 'open' ? 'open' : 'submitted',
    per_page: 30,
  });

  const filteredRequests = useMemo(() => {
    const items = data?.items ?? [];
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((request) => {
      const haystack = [
        request.reference,
        request.title,
        request.description,
        request.customer?.name,
        providerCategoryLabel(request, locale),
        request.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [data?.items, debouncedSearch, locale]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-diyar-dark mb-2">طلبات العملاء</h1>
        <p className="text-gray-500">
          تصفح الطلبات الخاصة التي قدمها العملاء وقدم عروض أسعارك ليتم اختيارك.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'open' ? 'bg-diyar-brown text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            الطلبات المتاحة
          </button>
          <button
            onClick={() => setActiveTab('offered')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'offered' ? 'bg-diyar-brown text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            عروضي المقدمة
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث في الطلبات..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
          <button
            type="button"
            className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState className="min-h-64" />
      ) : isError ? (
        <ErrorState
          message="تعذر تحميل طلبات العملاء"
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Link
                to={`/dashboard/service/client-requests/${request.id}`}
                key={request.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col p-5 group focus:outline-none focus:ring-2 focus:ring-diyar-brown focus:border-transparent"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-3 py-1 bg-diyar-cream/30 text-diyar-brown text-xs font-bold rounded-lg truncate max-w-37.5">
                    {providerCategoryLabel(request, locale)}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock size={12} /> {formatProviderRequestDate(request.created_at, locale)}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 mb-2 truncate group-hover:text-diyar-brown transition-colors">
                  طلب {request.customer?.name ?? 'عميل'}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{request.description}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{request.location ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-700">
                      الميزانية:{' '}
                      <span dir="ltr">
                        {formatProviderBudget(request.budget_min, request.budget_max, locale)}
                      </span>
                    </span>
                  </div>
                </div>

                <hr className="border-gray-50 mb-4" />

                {activeTab === 'open' ? (
                  <div className="w-full bg-diyar-brown text-white py-2 rounded-xl text-sm font-bold text-center group-hover:bg-[#8A6D46] transition-colors">
                    عرض التفاصيل
                  </div>
                ) : (
                  <div className="w-full bg-green-50 text-green-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> تم تقديم العرض
                  </div>
                )}
              </Link>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center">
              <MessageSquare size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد طلبات هنا حالياً</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                قم بالتحقق مجدداً في وقت لاحق لرؤية الطلبات الجديدة المقدمة من قبل العملاء.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
