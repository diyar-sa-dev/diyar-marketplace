import { useState } from 'react';
import { ArrowRight, CheckCircle, Download, Package, Truck, XCircle } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import { useToast } from '../../../../hooks/useToast.ts';
import { formatOrderDate } from '../../../../lib/formatOrderDate.ts';
import { openVendorOrderInvoice } from '../../../../lib/vendorOrderInvoice.ts';
import { LoadingState } from '../../../common/LoadingState.tsx';
import { VendorOrderStatusBadge } from './VendorOrderStatusBadge.tsx';
import { VendorOrderProductsPanel, VendorOrderTrackingTimeline } from './VendorOrderDetailPanels.tsx';
import { VendorOrderInfoSidebar } from './VendorOrderInfoSidebar.tsx';
import { VendorOrderShipModal } from './VendorOrderShipModal.tsx';
import { vendorOrderDisplayNumber, type VendorOrderAction } from './vendorOrderUtils.ts';
import type { VendorOrder } from '../../../../types/order.ts';

export function VendorOrderDetailView({
  order,
  isLoading,
  onBack,
  onAction,
  isPending,
}: {
  order: VendorOrder | null;
  isLoading?: boolean;
  onBack: () => void;
  onAction: (action: VendorOrderAction, payload?: { tracking_number: string; carrier?: string }) => void;
  isPending: boolean;
}) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [shipOpen, setShipOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  if (isLoading || !order) {
    return <LoadingState message={t('common.loading')} className="min-h-96" />;
  }

  const handleInvoice = async () => {
    setInvoiceLoading(true);
    try {
      await openVendorOrderInvoice(order.id);
    } catch {
      toast.error(t('vendorOrders.invoiceError'));
    } finally {
      setInvoiceLoading(false);
    }
  };

  const runAction = (action: VendorOrderAction) => {
    setStatusOpen(false);
    if (action === 'ship') {
      setShipOpen(true);
      return;
    }
    onAction(action);
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-diyar-dark"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-diyar-dark">
              {t('vendorOrders.detailTitle', { number: vendorOrderDisplayNumber(order) })}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{formatOrderDate(order.created_at, locale)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={invoiceLoading}
            onClick={() => void handleInvoice()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {t('vendorOrders.downloadInvoice')}
          </button>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="relative">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setStatusOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-diyar-brown px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#A67B5B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('vendorOrders.updateStatus')}
              </button>

              {statusOpen && (
                <div className="absolute inset-e-0 top-full z-10 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => runAction('accept')}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <CheckCircle size={14} />
                      {t('vendorOrders.actions.accept')}
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => runAction('process')}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Package size={14} />
                      {t('vendorOrders.actions.process')}
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      type="button"
                      onClick={() => runAction('ship')}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Truck size={14} />
                      {t('vendorOrders.actions.ship')}
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      type="button"
                      onClick={() => runAction('deliver')}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <CheckCircle size={14} />
                      {t('vendorOrders.actions.deliver')}
                    </button>
                  )}
                  {['pending', 'accepted', 'processing'].includes(order.status) && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={() => runAction('cancel')}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <XCircle size={14} />
                        {t('vendorOrders.actions.cancel')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <VendorOrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VendorOrderProductsPanel order={order} />
          <VendorOrderTrackingTimeline order={order} />
        </div>
        <VendorOrderInfoSidebar order={order} />
      </div>

      <VendorOrderShipModal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        onSubmit={(payload) => {
          onAction('ship', payload);
          setShipOpen(false);
        }}
      />
    </div>
  );
}
