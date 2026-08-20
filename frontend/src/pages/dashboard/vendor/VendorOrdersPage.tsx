import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { usePaginationState } from '../../../hooks/usePaginationState.ts';
import { useVendorOrder, useVendorOrders } from '../../../hooks/vendor/useVendorOrders.ts';
import { useVendorOrderActions } from '../../../hooks/vendor/useVendorOrderActions.ts';
import { useVendorAccess } from '../../../hooks/vendor/useVendorTeam.ts';
import { vendorCanWrite } from '../../../api/vendorTeam.ts';
import { ErrorState } from '../../../components/common/ErrorState.tsx';
import { DashboardPaginatedTable } from '../../../components/dashboard/common/DashboardPaginatedTable.tsx';
import { VendorOrdersHeader } from '../../../components/dashboard/vendor/orders/VendorOrdersHeader.tsx';
import { VendorOrdersToolbar } from '../../../components/dashboard/vendor/orders/VendorOrdersToolbar.tsx';
import { VendorOrdersRowList } from '../../../components/dashboard/vendor/orders/VendorOrdersRowList.tsx';
import { VendorOrderDetailView } from '../../../components/dashboard/vendor/orders/VendorOrderDetailView.tsx';
import { VendorPreordersPanel } from '../../../components/dashboard/vendor/orders/VendorPreordersPanel.tsx';
import {
  type PaymentFilter,
  type VendorOrderAction,
  type VendorOrderTab,
  parseVendorOrderTab,
} from '../../../components/dashboard/vendor/orders/vendorOrderUtils.ts';

export default function VendorOrdersPage() {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseVendorOrderTab(searchParams.get('tab'));
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { page, perPage, onPageChange, onPerPageChange, resetPage } = usePaginationState({
    initialPerPage: 15,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isPreordersTab = activeTab === 'preorders';

  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      q: debouncedSearch.trim() || undefined,
      status: isPreordersTab ? undefined : activeTab,
      payment_status: paymentFilter,
    }),
    [activeTab, debouncedSearch, isPreordersTab, page, perPage, paymentFilter],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useVendorOrders(filters, {
    enabled: !isPreordersTab,
  });
  const { data: vendorAccess } = useVendorAccess();
  const canWriteOrders = vendorCanWrite(vendorAccess?.permissions.orders);
  const { data: selectedOrder, isLoading: detailLoading } = useVendorOrder(selectedOrderId);
  const actionMutation = useVendorOrderActions((order) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(order.id);
    }
  });

  const tabs = [
    { id: 'all' as const, label: t('vendorOrders.tabs.all') },
    { id: 'pending' as const, label: t('vendorOrders.tabs.pending') },
    { id: 'processing' as const, label: t('vendorOrders.tabs.processing') },
    { id: 'shipped' as const, label: t('vendorOrders.tabs.shipped') },
    { id: 'delivered' as const, label: t('vendorOrders.tabs.delivered') },
    { id: 'preorders' as const, label: t('vendorOrders.tabs.preorders') },
  ];

  const orders = data?.vendor_orders ?? [];
  const pagination = data?.pagination;

  const handleAction = (
    orderId: string,
    action: VendorOrderAction,
    payload?: { tracking_number: string; carrier?: string },
  ) => {
    actionMutation.mutate({ orderId, action, payload });
  };

  const handleTabChange = (tab: VendorOrderTab) => {
    resetPage();
    if (tab === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
      return;
    }
    setSearchParams({ tab }, { replace: true });
  };

  if (isError && !isPreordersTab) {
    return <ErrorState error={error} title={t('orders.error')} onRetry={() => void refetch()} />;
  }

  if (selectedOrderId) {
    return (
      <VendorOrderDetailView
        order={selectedOrder ?? null}
        isLoading={detailLoading || !selectedOrder}
        onBack={() => setSelectedOrderId(null)}
        isPending={actionMutation.isPending}
        onAction={(action, payload) => handleAction(selectedOrderId, action, payload)}
        canWriteOrders={canWriteOrders}
      />
    );
  }

  const tableHeader = (
    <div className="hidden rounded-xl border border-gray-100 bg-gray-50 px-6 py-3 text-sm font-bold text-gray-600 md:grid md:grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.8fr_0.7fr_0.9fr_0.5fr] md:gap-3">
      <span>{t('vendorOrders.table.orderNumber')}</span>
      <span>{t('vendorOrders.table.customer')}</span>
      <span>{t('vendorOrders.table.date')}</span>
      <span>{t('vendorOrders.table.items')}</span>
      <span>{t('vendorOrders.table.total')}</span>
      <span>{t('vendorOrders.table.payment')}</span>
      <span>{t('vendorOrders.table.status')}</span>
      <span className="text-end">{t('vendorOrders.table.actions')}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <VendorOrdersHeader />

      <VendorOrdersToolbar
        searchTerm={searchInput}
        onSearchChange={(value) => {
          setSearchInput(value);
          resetPage();
        }}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(value) => {
          setPaymentFilter(value);
          resetPage();
          setIsFilterOpen(false);
        }}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen((open) => !open)}
        isSearching={isFetching && debouncedSearch.trim().length > 0}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
        hideFilters={isPreordersTab}
      />

      {isPreordersTab ? (
        <VendorPreordersPanel />
      ) : (
        <DashboardPaginatedTable
          columns={tableHeader}
          isLoading={isLoading}
          isEmpty={orders.length === 0}
          emptyTitle={t('vendorOrders.emptySearch')}
          emptyDescription={t('vendorOrders.emptyDescription')}
          skeletonColumns={8}
          pagination={pagination}
          page={page}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        >
          <VendorOrdersRowList
            orders={orders}
            onView={(order) => setSelectedOrderId(order.id)}
            onAction={handleAction}
            isPending={actionMutation.isPending}
            canWriteOrders={canWriteOrders}
          />
        </DashboardPaginatedTable>
      )}
    </div>
  );
}
