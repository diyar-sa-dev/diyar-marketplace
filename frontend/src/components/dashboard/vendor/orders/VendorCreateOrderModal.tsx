import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import type { CreateManualVendorOrderPayload } from '../../../../types/order.ts';

const defaultForm: CreateManualVendorOrderPayload = {
  customer_name: '',
  vendor_total: '',
  items_count: 1,
  status: 'pending',
  payment_status: 'paid',
};

export function VendorCreateOrderModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateManualVendorOrderPayload) => Promise<void>;
  isPending: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<CreateManualVendorOrderPayload>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const update = <K extends keyof CreateManualVendorOrderPayload>(
    key: K,
    value: CreateManualVendorOrderPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 rounded-2xl border border-gray-100 bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-diyar-dark">{t('vendorOrders.createModalTitle')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">{t('vendorOrders.create.customerName')}</label>
            <input
              required
              type="text"
              value={form.customer_name}
              onChange={(event) => update('customer_name', event.target.value)}
              placeholder={t('vendorOrders.create.customerNamePlaceholder')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none focus:ring-1 focus:ring-diyar-brown"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('vendorOrders.create.orderTotal')}</label>
              <input
                required
                type="text"
                inputMode="decimal"
                value={form.vendor_total}
                onChange={(event) => update('vendor_total', event.target.value)}
                placeholder={t('vendorOrders.create.orderTotalPlaceholder')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none focus:ring-1 focus:ring-diyar-brown"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('vendorOrders.create.itemsCount')}</label>
              <input
                required
                type="number"
                min={1}
                max={100}
                value={form.items_count}
                onChange={(event) => update('items_count', Number(event.target.value) || 1)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none focus:ring-1 focus:ring-diyar-brown"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('vendorOrders.create.orderStatus')}</label>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none"
              >
                <option value="pending">{t('vendorOrders.statuses.pending')}</option>
                <option value="processing">{t('vendorOrders.statuses.processing')}</option>
                <option value="shipped">{t('vendorOrders.statuses.shipped')}</option>
                <option value="delivered">{t('vendorOrders.statuses.delivered')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('vendorOrders.create.paymentStatus')}</label>
              <select
                value={form.payment_status}
                onChange={(event) => update('payment_status', event.target.value as 'paid' | 'pending')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none"
              >
                <option value="paid">{t('vendorOrders.payment.paid')}</option>
                <option value="pending">{t('vendorOrders.paymentFilter.pending')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              {t('vendorOrders.modalCancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-xl bg-diyar-brown px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67B5B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? t('common.loading') : t('vendorOrders.create.saveOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
