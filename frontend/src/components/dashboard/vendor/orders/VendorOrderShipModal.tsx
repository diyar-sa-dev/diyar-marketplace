import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';

export function VendorOrderShipModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { tracking_number: string; carrier?: string }) => void;
}) {
  const { t } = useLocale();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h3 className="text-lg font-bold text-diyar-dark">{t('vendorOrders.shipModalTitle')}</h3>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl p-2 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!trackingNumber.trim()) {
              return;
            }

            onSubmit({
              tracking_number: trackingNumber.trim(),
              carrier: carrier.trim() || undefined,
            });
            setTrackingNumber('');
            setCarrier('');
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">{t('vendorOrders.trackingPlaceholder')}</label>
            <input
              required
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-diyar-brown focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">{t('vendorOrders.carrierPlaceholder')}</label>
            <input
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-diyar-brown focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50"
            >
              {t('vendorOrders.modalCancel')}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-diyar-brown px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A67B5B]"
            >
              {t('vendorOrders.actions.ship')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
