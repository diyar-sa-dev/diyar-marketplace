import { useLocale } from '../../../../hooks/useLocale.ts';

export function VendorOrdersHeader() {
  const { t } = useLocale();

  return (
    <div className="border-b border-gray-100 pb-1">
      <h2 className="text-2xl font-bold text-diyar-dark">{t('vendorOrders.title')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('vendorOrders.subtitle')}</p>
    </div>
  );
}
