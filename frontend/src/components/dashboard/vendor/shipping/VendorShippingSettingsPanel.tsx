import { useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Info,
  MapPin,
  Package,
  Save,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Zap,
} from 'lucide-react';
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
  const [modalType, setModalType] = useState<'manual' | 'carrier' | null>(null);

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

        <div className="grid grid-cols-1 items-start gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
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
              <label
                htmlFor="use-advanced-rules"
                className="text-xs font-medium text-gray-700 cursor-pointer"
              >
                {t('shipping.useAdvancedRules')}
              </label>
            </div>

            {form.use_advanced_rules ? (
              <div className="space-y-3.5 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    {locale === 'ar' ? 'نمط إدارة الشحن والتسعير' : 'Fulfillment & Dispatch Mode'}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={11} />
                    {locale === 'ar' ? 'خيارات متقدمة' : 'Advanced'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {locale === 'ar'
                    ? 'اختر طريقة احتساب الشحن والتنفيذ المناسبة لمتجرك:'
                    : 'Choose your fulfillment and dispatch mode:'}
                </p>

                {/* Segmented / Interactive Card Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-xl border border-gray-200/70">
                  {/* Mode 1 Tab: Manual */}
                  <button
                    type="button"
                    onClick={() => {
                      update('fulfillment_type', 'manual');
                      update('selected_carrier_code', 'manual');
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      (form.fulfillment_type ?? 'manual') === 'manual'
                        ? 'bg-white text-diyar-brown font-bold shadow-sm border border-diyar-brown/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Truck
                        size={15}
                        className={
                          (form.fulfillment_type ?? 'manual') === 'manual'
                            ? 'text-diyar-brown'
                            : 'text-gray-400'
                        }
                      />
                      <span>{locale === 'ar' ? 'شحن يدوي' : 'Manual'}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {locale === 'ar' ? 'أسطول المتجر' : 'Store Fleet'}
                    </span>
                  </button>

                  {/* Mode 2 Tab: Automated Carrier */}
                  <button
                    type="button"
                    onClick={() => {
                      update('fulfillment_type', 'carrier');
                      const firstActive = data?.availableCarriers?.[0]?.carrier_code;
                      if (firstActive) {
                        update('selected_carrier_code', firstActive);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      (form.fulfillment_type ?? 'manual') === 'carrier'
                        ? 'bg-white text-amber-800 font-bold shadow-sm border border-amber-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap
                        size={15}
                        className={
                          (form.fulfillment_type ?? 'manual') === 'carrier'
                            ? 'text-amber-600'
                            : 'text-gray-400'
                        }
                      />
                      <span>{locale === 'ar' ? 'ربط آلي V2' : 'Auto Carrier'}</span>
                    </div>
                    <span className="text-[10px] text-amber-600/90 font-medium bg-amber-100/60 px-1.5 rounded">
                      {locale === 'ar' ? 'بوالص AWB' : 'Live AWB'}
                    </span>
                  </button>
                </div>

                {/* Active Mode Configuration Container */}
                {(form.fulfillment_type ?? 'manual') === 'manual' ? (
                  <div className="rounded-xl border border-diyar-brown/30 bg-diyar-cream/20 p-3.5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-diyar-brown/10 text-diyar-brown">
                          <Truck size={15} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">
                            {locale === 'ar'
                              ? 'الشحن اليدوي / أسطول المتجر'
                              : 'Manual Shipping / Dedicated Fleet'}
                          </h5>
                          <p className="text-[10px] text-gray-500">
                            {locale === 'ar'
                              ? 'توصيل عبر ناقلي المتجر أو مندوبيكم المعتمدين'
                              : 'Delivery via store messengers or manual carriers'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalType('manual')}
                        className="p-1 text-gray-400 hover:text-diyar-brown transition-colors rounded-full hover:bg-white"
                        title={
                          locale === 'ar'
                            ? 'عرض تفاصيل وقواعد الأسعار'
                            : 'View rate rules and pricing'
                        }
                      >
                        <HelpCircle size={15} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-diyar-brown/15 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">
                          {locale === 'ar' ? 'الناقل المعتمد المختار:' : 'Selected Manual Carrier:'}
                        </label>
                        <select
                          value={
                            form.selected_carrier_code === 'manual' || !form.selected_carrier_code
                              ? 'manual'
                              : form.selected_carrier_code
                          }
                          onChange={(e) => update('selected_carrier_code', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-diyar-brown focus:outline-none shadow-xs"
                        >
                          <option value="manual">
                            {locale === 'ar'
                              ? 'الأسطول الخاص بالمتجر (افتراضي)'
                              : 'Store Dedicated Fleet (Default)'}
                          </option>
                          {(data?.manualCarriers ?? []).map((carrier) => (
                            <option key={carrier.id} value={carrier.code}>
                              {carrier.name} ({carrier.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {data?.manualCarriers && data.manualCarriers.length > 0 ? (
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/50 p-2 rounded-lg">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-emerald-600" />
                            {locale === 'ar'
                              ? `يتوفر ${data.manualCarriers.length} ناقل مهيأ من الإدارة`
                              : `${data.manualCarriers.length} carrier(s) configured by admin`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setModalType('manual')}
                            className="underline font-bold text-emerald-900 hover:text-emerald-950"
                          >
                            {locale === 'ar' ? 'عرض الأسعار' : 'View Rates'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-500 bg-white/80 p-2 rounded-lg border border-dashed border-gray-200">
                          {locale === 'ar'
                            ? 'لم يتم تهيئة ناقلين يدويين محددين من الإدارة، سيتم الاعتماد على التسعيرة الثابتة.'
                            : 'No manual carriers configured by admin; flat rate will apply.'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-3.5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-100 text-amber-700">
                          <Zap size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-gray-900">
                              {locale === 'ar'
                                ? 'شركات الشحن المعتمدة (الربط الآلي)'
                                : 'Approved Courier Companies (Automated)'}
                            </h5>
                            <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              Live
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500">
                            {locale === 'ar'
                              ? 'إصدار وتتبع آلي مع شركات النقل المعتمدة في المملكة'
                              : 'Automated waybill creation & tracking with Saudi providers'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalType('carrier')}
                        className="p-1 text-gray-400 hover:text-amber-700 transition-colors rounded-full hover:bg-white"
                        title={
                          locale === 'ar'
                            ? 'عرض تفاصيل الربط الآلي'
                            : 'View carrier provider details'
                        }
                      >
                        <HelpCircle size={15} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 space-y-2">
                      {data?.availableCarriers && data.availableCarriers.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-700">
                              {locale === 'ar'
                                ? 'اختر شركة الشحن الآلية المعتمدة:'
                                : 'Select Approved Provider:'}
                            </label>
                            <select
                              value={
                                form.selected_carrier_code ?? data.availableCarriers[0].carrier_code
                              }
                              onChange={(e) => update('selected_carrier_code', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-amber-500 focus:outline-none shadow-xs"
                            >
                              {data.availableCarriers.map((carrier) => (
                                <option key={carrier.carrier_code} value={carrier.carrier_code}>
                                  {carrier.name}{' '}
                                  {carrier.is_sandbox
                                    ? locale === 'ar'
                                      ? '(بيئة تجريبية)'
                                      : '(Sandbox)'
                                    : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-100/70 border border-amber-200/70 p-2 rounded-lg">
                            <span className="truncate pe-1">
                              {locale === 'ar'
                                ? `النشط: ${data.availableCarriers.find((c) => c.carrier_code === form.selected_carrier_code)?.name ?? data.availableCarriers[0].name}`
                                : `Active: ${data.availableCarriers.find((c) => c.carrier_code === form.selected_carrier_code)?.name ?? data.availableCarriers[0].name}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setModalType('carrier')}
                              className="shrink-0 underline font-bold hover:text-amber-950"
                            >
                              {locale === 'ar' ? 'التفاصيل والربط' : 'Details'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                          {locale === 'ar'
                            ? 'لا توجد شركات شحن آلية مفعلة حالياً من قبل الإدارة. يرجى مراجعة إدارة المنصة أو استخدام الشحن اليدوي.'
                            : 'No automated carriers are currently active from Admin. Please contact platform management or use manual fleet.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

      {/* Information / Rate Rules Modal */}
      {modalType !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="text-diyar-brown" size={20} />
                <h4 className="font-bold text-gray-900 text-sm md:text-base">
                  {modalType === 'manual'
                    ? locale === 'ar'
                      ? 'تفاصيل وقواعد أسعار الشحن اليدوي'
                      : 'Manual Shipping & Rate Rules Details'
                    : locale === 'ar'
                      ? 'تفاصيل الربط الآلي وشركات الشحن'
                      : 'Automated Carrier Gateway Details'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pe-1 text-xs text-gray-600">
              {modalType === 'manual' ? (
                <>
                  <p className="leading-relaxed">
                    {locale === 'ar'
                      ? 'قواعد الأسعار والناقلين المعتمدين التالية تم ضبطها مركزياً من لوحة إدارة المنصة لتطبيق حساب تكلفة الشحن على طلبات عملائك تلقائياً بحسب الوزن والمنطقة:'
                      : 'The following carriers and rate rules are configured centrally by admin to calculate shipping charges by weight and zone:'}
                  </p>
                  {data?.manualCarriers && data.manualCarriers.length > 0 ? (
                    <div className="space-y-3">
                      {data.manualCarriers.map((carrier) => (
                        <div
                          key={carrier.id}
                          className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between font-bold text-diyar-dark text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {carrier.name}
                            </span>
                            <span className="font-mono text-gray-400 text-[11px]">
                              {carrier.code}
                            </span>
                          </div>

                          {(carrier.methods ?? []).length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {carrier.methods!.map((method) => (
                                <div
                                  key={method.id}
                                  className="bg-white rounded-lg p-2.5 border border-gray-100 space-y-1"
                                >
                                  <div className="flex justify-between font-semibold text-gray-800">
                                    <span>
                                      {method.name} ({method.code})
                                    </span>
                                  </div>
                                  {(method.rate_rules ?? []).map((rule) => (
                                    <div
                                      key={rule.id}
                                      className="flex justify-between text-[11px] text-gray-500 pt-0.5"
                                    >
                                      <span>
                                        نطاق الوزن: {rule.min_weight_kg} -{' '}
                                        {rule.max_weight_kg ?? '∞'} كجم
                                      </span>
                                      <span className="font-bold text-diyar-brown">
                                        {rule.rate} SAR
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">
                              لا توجد طرق شحن مرتبطة بهذا الناقل حالياً.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-400">
                      لا توجد قواعد أسعار يدوية مضافة حالياً في لوحة الإدارة.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="leading-relaxed">
                    {locale === 'ar'
                      ? 'بوابات الشحن الآلية المعتمدة تتيح إصدار بوليصات الشحن (AWB) وتتبع الشحنات آلياً دون الحاجة لتواصل يدوي مع المناديب:'
                      : 'Automated carrier gateways issue live waybills (AWBs) and track delivery automatically:'}
                  </p>
                  {data?.availableCarriers && data.availableCarriers.length > 0 ? (
                    <div className="space-y-3">
                      {data.availableCarriers.map((carrier) => (
                        <div
                          key={carrier.carrier_code}
                          className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between font-bold text-amber-900 text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                              {carrier.name}
                            </span>
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">
                              {carrier.is_sandbox ? 'Sandbox (بيئة تجريبية)' : 'Production (مباشر)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900/80 leading-normal">
                            مزود شحن سعودي معتمد ومفعل في لوحة التحكم الإدارية. عند اختياره، سيتم
                            إنشاء بوليصة الشحن واستدعاء المندوب لاستلام الطلب من عنوان المستودع
                            المعتمد لمتجرك آلياً.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-400">
                      لا توجد شركات شحن آلية مفعلة حالياً من الإدارة.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
