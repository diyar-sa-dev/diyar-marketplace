import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  effective_status: string;
  subtotal: string;
  shipping_total: string;
  discount_total: string;
  vat_amount: string;
  grand_total: string;
  created_at?: string;
  shipping_address?: {
    recipient_name?: string;
    phone?: string;
    city?: string;
    district?: string;
    street?: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  payment?: {
    id: string;
    status: string;
    amount: string;
    gateway?: string;
    transaction_id?: string | null;
  };
  vendor_orders?: Array<{
    id: string;
    status: string;
    vendor_account?: { business_name?: string; slug?: string };
    items?: Array<{
      id: string;
      product_name?: string;
      quantity: number;
      unit_price: string;
      line_total: string;
    }>;
  }>;
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('summary');

  const {
    data: order,
    isLoading,
    isError,
  } = useAdminDetailQuery<OrderDetail>({
    resourceKey: 'admin-order-detail',
    endpoint: `/admin/orders/${orderId}`,
    dataKey: 'order',
    enabled: Boolean(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await adminApi.post(`/admin/orders/${orderId}/cancel`);
    },
    onSuccess: async () => {
      showToast(t('admin.detail.order.cancelled'), 'success');
      await queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => {
      showToast(t('admin.detail.order.cancelError'), 'error');
    },
  });

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.detail.order.loadError')}
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: t('admin.detail.tabs.summary') },
    { id: 'customer', label: t('admin.detail.tabs.customer') },
    { id: 'items', label: t('admin.detail.tabs.items') },
    { id: 'payment', label: t('admin.detail.tabs.payment') },
    { id: 'shipping', label: t('admin.detail.tabs.shipping') },
  ];

  const canCancel = order.status === 'pending' || order.effective_status === 'pending';

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/orders"
        backLabel={t('admin.detail.backToOrders')}
        title={order.order_number}
        subtitle={order.created_at ? new Date(order.created_at).toLocaleString() : undefined}
        status={order.effective_status}
        actions={
          canCancel ? (
            <PermissionGate permission="orders.action">
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('admin.detail.order.cancelConfirm'))) {
                    cancelMutation.mutate();
                  }
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              >
                {t('admin.detail.order.cancel')}
              </button>
            </PermissionGate>
          ) : null
        }
      />

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {activeTab === 'summary' ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.subtotal')}
              </dt>
              <dd className="mt-1 text-lg font-bold text-diyar-dark">{order.subtotal}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.order.shipping')}
              </dt>
              <dd className="mt-1 text-lg font-bold text-diyar-dark">{order.shipping_total}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.order.discount')}
              </dt>
              <dd className="mt-1 text-lg font-bold text-diyar-dark">{order.discount_total}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.order.vat')}
              </dt>
              <dd className="mt-1 text-lg font-bold text-diyar-dark">{order.vat_amount}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.amount')}
              </dt>
              <dd className="mt-1 text-lg font-bold text-diyar-dark">{order.grand_total}</dd>
            </div>
          </dl>
        ) : null}

        {activeTab === 'customer' ? (
          order.user ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.name')}
                </dt>
                <dd className="mt-1 font-semibold text-diyar-dark">{order.user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.contact')}
                </dt>
                <dd className="mt-1 text-gray-700">
                  {order.user.email ?? order.user.phone ?? '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">{t('admin.detail.order.noCustomer')}</p>
          )
        ) : null}

        {activeTab === 'items' ? (
          <div className="space-y-4">
            {(order.vendor_orders ?? []).map((vendorOrder) => (
              <div key={vendorOrder.id} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-diyar-dark">
                    {vendorOrder.vendor_account?.business_name ??
                      vendorOrder.vendor_account?.slug ??
                      '—'}
                  </p>
                  <AdminStatusBadge status={vendorOrder.status} />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-start text-gray-500">
                        <th className="px-2 py-2 font-semibold">
                          {t('admin.detail.order.product')}
                        </th>
                        <th className="px-2 py-2 font-semibold">{t('admin.detail.order.qty')}</th>
                        <th className="px-2 py-2 font-semibold">
                          {t('admin.detail.order.unitPrice')}
                        </th>
                        <th className="px-2 py-2 font-semibold">
                          {t('admin.detail.order.lineTotal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(vendorOrder.items ?? []).map((item) => (
                        <tr key={item.id} className="border-t border-gray-50">
                          <td className="px-2 py-2">{item.product_name ?? '—'}</td>
                          <td className="px-2 py-2">{item.quantity}</td>
                          <td className="px-2 py-2">{item.unit_price}</td>
                          <td className="px-2 py-2 font-semibold">{item.line_total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === 'payment' ? (
          order.payment ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.status')}
                </dt>
                <dd className="mt-1">
                  <AdminStatusBadge status={order.payment.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.amount')}
                </dt>
                <dd className="mt-1 font-semibold text-diyar-dark">{order.payment.amount}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.gateway')}
                </dt>
                <dd className="mt-1 text-gray-700">{order.payment.gateway ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.detail.order.transactionId')}
                </dt>
                <dd className="mt-1 font-mono text-sm text-gray-700">
                  {order.payment.transaction_id ?? '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">{t('admin.detail.order.noPayment')}</p>
          )
        ) : null}

        {activeTab === 'shipping' ? (
          order.shipping_address ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.detail.order.recipient')}
                </dt>
                <dd className="mt-1 font-semibold text-diyar-dark">
                  {order.shipping_address.recipient_name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.contact')}
                </dt>
                <dd className="mt-1 text-gray-700">{order.shipping_address.phone ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.detail.order.address')}
                </dt>
                <dd className="mt-1 text-gray-700">
                  {[
                    order.shipping_address.city,
                    order.shipping_address.district,
                    order.shipping_address.street,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">{t('admin.detail.order.noShipping')}</p>
          )
        ) : null}
      </div>
    </div>
  );
}
