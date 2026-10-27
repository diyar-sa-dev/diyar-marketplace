import { useEffect, useState } from 'react';
import { Info, MapPin, Package, Save, Truck } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import { useToast } from '../../../../hooks/useToast.ts';
import {
  useUpdateVendorShippingSettings,
  useVendorShippingSettings,
} from '../../../../hooks/vendor/useVendorShippingSettings.ts';
import { LoadingState } from '../../../common/LoadingState.tsx';
import { ShippingMethodOptionCard } from './ShippingMethodOptionCard.tsx';
import type { VendorShippingSettingsPayload } from '../../../../types/shipping.ts';

const defaultForm: VendorShippingSettingsPayload = {
  carrier_enabled: true,
  carrier_flat_rate: '30.00',
  carrier_free_shipping_enabled: false,
  carrier_free_shipping_threshold: null,
  pickup_enabled: false,
  pickup_location_label: null,
  use_advanced_rules: false,
};

export function VendorShippingSettingsPanel() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const { data, isLoading } = useVendorShippingSettings();
  const saveMutation = useUpdateVendorShippingSettings();
  const [form, setForm] = useState<VendorShippingSettingsPayload>(defaultForm);

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
    }
  }, [data]);

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  const update = <K extends keyof VendorShippingSettingsPayload>(
    key: K,
    value: VendorShippingSettingsPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.carrier_enabled && !form.pickup_enabled) {
      toast.error(t('shipping.atLeastOneMethod'));
      return;
    }

    try {
      await saveMutation.mutateAsync(form);
      toast.success(t('shipping.settingsSaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.unexpected'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <p className="text-sm leading-relaxed text-amber-800">{t('shipping.settingsIntro')}</p>
      </div>

      <div className="space-y-4">
        <h3 className="border-b border-gray-100 pb-2 font-bold text-diyar-dark">
          {t('shipping.availableMethodsTitle')}
        </h3>

        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
          <ShippingMethodOptionCard
            selected={form.carrier_enabled}
            icon={Truck}
            iconClassName="bg-amber-100 text-amber-700"
            title={t('shipping.carrierCardTitle')}
            description={t('shipping.carrierCardDescription')}
            onSelect={() => update('carrier_enabled', !form.carrier_enabled)}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {t('shipping.flatRateShort')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.carrier_flat_rate ?? ''}
                onChange={(event) => update('carrier_flat_rate', event.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-diyar-brown focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="free-shipping-threshold"
                checked={form.carrier_free_shipping_enabled}
                onChange={(event) => update('carrier_free_shipping_enabled', event.target.checked)}
                className="rounded text-diyar-brown focus:ring-diyar-brown"
              />
              <label htmlFor="free-shipping-threshold" className="text-xs text-gray-700">
                {t('shipping.freeShipping')}
              </label>
            </div>

            {form.carrier_free_shipping_enabled ? (
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.carrier_free_shipping_threshold ?? ''}
                  onChange={(event) =>
                    update('carrier_free_shipping_threshold', event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 py-2 pe-3 ps-8 text-sm focus:border-diyar-brown focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {t('common.currency')}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                type="checkbox"
                id="use-advanced-rules"
                checked={form.use_advanced_rules ?? false}
                onChange={(event) => update('use_advanced_rules', event.target.checked)}
                className="rounded text-diyar-brown focus:ring-diyar-brown"
              />
              <label htmlFor="use-advanced-rules" className="text-xs font-medium text-gray-700">
                {t('shipping.useAdvancedRules')}
              </label>
            </div>
            {form.use_advanced_rules ? (
              <div className="space-y-4 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
                <p className="text-[11px] text-gray-500 leading-normal">
                  {t('shipping.advancedRulesHint')}
                </p>

                {/* Sub-section 1: Manual configured carriers & rate rules from Admin */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">
                      {locale === 'ar' ? '1. الناقلون المعتمدون يدوياً وقواعد الأسعار' : '1. Configured Carriers & Rate Rules'}
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      {locale === 'ar' ? 'من لوحة الإدارة' : 'From Admin'}
                    </span>
                  </div>

                  {(data?.manualCarriers && data.manualCarriers.length > 0) ? (
                    <div className="space-y-2 pt-1">
                      {data.manualCarriers.map((carrier) => (
                        <div key={carrier.id} className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs">
                          <div className="font-bold text-diyar-dark flex justify-between">
                            <span>{carrier.name}</span>
                            <span className="text-gray-400 font-mono">{carrier.code}</span>
                          </div>
                          {(carrier.methods ?? []).map((method) => (
                            <div key={method.id} className="mt-1 text-[11px] text-gray-600 border-t border-gray-50 pt-1">
                              <div className="flex justify-between font-medium">
                                <span>{method.name}</span>
                                <span>{method.rate_rules?.[0]?.rate ? `${method.rate_rules[0].rate} SAR` : '-'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      {locale === 'ar' ? 'لا توجد قواعد أسعار يدوية مهيأة حالياً في لوحة الإدارة.' : 'No manual carrier rate rules configured currently by admin.'}
                    </p>
                  )}
                </div>

                {/* Sub-section 2: Automated Saudi Courier Providers */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      {locale === 'ar' ? '2. إعدادات الشحن عبر شركات التوصيل المعتمدة' : '2. Approved Courier Providers'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      {locale === 'ar' ? 'ربط آلي' : 'Automated'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700">
                      {locale === 'ar' ? 'نموذج التنفيذ' : 'Fulfillment Model'}
                    </label>
                    <select
                      value={form.fulfillment_type ?? 'manual'}
                      onChange={(e) => update('fulfillment_type', e.target.value as any)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-diyar-brown focus:outline-none"
                    >
                      <option value="manual">{locale === 'ar' ? 'توصيل يدوي / أسطول المتجر الخاص' : 'Manual / Store Dedicated Fleet'}</option>
                      <option value="carrier">{locale === 'ar' ? 'ربط آلي عبر بوليصات شركات الشحن' : 'Automated Carrier Waybills'}</option>
                      <option value="hybrid">{locale === 'ar' ? 'هجين (آلي للطرود + يدوي للأثاث الثقيل)' : 'Hybrid (Automated Parcels + Manual Furniture)'}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700">
                      {locale === 'ar' ? 'شركة الشحن المختارة' : 'Selected Carrier Provider'}
                    </label>
                    <select
                      value={form.selected_carrier_code ?? 'manual'}
                      onChange={(e) => update('selected_carrier_code', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-diyar-brown focus:outline-none"
                    >
                      <option value="manual">{locale === 'ar' ? 'بدون ربط آلي (شحن يدوي)' : 'No automated carrier (Manual)'}</option>
                      {(data?.availableCarriers ?? []).map((carrier) => (
                        <option key={carrier.carrier_code} value={carrier.carrier_code}>
                          {carrier.name} {carrier.is_sandbox ? '(Sandbox)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </ShippingMethodOptionCard>

          <ShippingMethodOptionCard
            selected={false}
            disabled
            icon={Package}
            iconClassName="bg-gray-100 text-gray-500"
            title={t('shipping.warehouseCardTitle')}
            description={t('shipping.warehouseCardDescription')}
            badge={t('shipping.comingSoon')}
          >
            <div className="pointer-events-none space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {t('shipping.warehouseScope')}
                </label>
                <select
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm"
                >
                  <option>{t('shipping.warehouseSameCity')}</option>
                </select>
              </div>
            </div>
          </ShippingMethodOptionCard>

          <ShippingMethodOptionCard
            selected={form.pickup_enabled}
            icon={MapPin}
            iconClassName="bg-blue-50 text-blue-600"
            title={t('shipping.pickupCardTitle')}
            description={t('shipping.pickupCardDescription')}
            onSelect={() => update('pickup_enabled', !form.pickup_enabled)}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">{t('shipping.pickupLabel')}</label>
              <input
                type="text"
                value={form.pickup_location_label ?? ''}
                onChange={(event) => update('pickup_location_label', event.target.value)}
                placeholder={t('shipping.pickupPlaceholder')}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-diyar-brown focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-blue-50/50 p-2 text-xs text-blue-700">
              <Info size={14} />
              {t('shipping.pickupNoDeliveryCost')}
            </div>
          </ShippingMethodOptionCard>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-diyar-brown px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#A67B5B]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={18} />
          {saveMutation.isPending ? t('common.loading') : t('shipping.saveSettings')}
        </button>
      </div>
    </div>
  );
}
