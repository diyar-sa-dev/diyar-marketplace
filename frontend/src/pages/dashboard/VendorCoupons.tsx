import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, Tag, X } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { CouponShareCard } from '../../components/coupon/CouponShareCard.tsx';
import { VendorCouponCard } from '../../components/coupon/VendorCouponCard.tsx';
import { VendorCouponFormModal } from '../../components/coupon/VendorCouponFormModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import {
  useCreateVendorCoupon,
  useToggleVendorCouponActive,
  useUpdateVendorCoupon,
  useVendorCoupons,
} from '../../hooks/vendor/useVendorCoupons.ts';
import { useVendorSettings } from '../../hooks/vendor/useVendorSettings.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { generateUniqueCouponCode } from '../../lib/couponCode.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { VendorCoupon, VendorCouponPayload } from '../../api/vendorCoupons.ts';

const EMPTY_FORM: VendorCouponPayload = {
  code: '',
  value: 10,
  minimum_order: 0,
  maximum_discount: null,
  starts_at: null,
  ends_at: null,
  usage_limit: null,
  is_active: true,
};

export default function VendorCoupons() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const currency = t('common.currency');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorCoupon | null>(null);
  const [form, setForm] = useState<VendorCouponPayload>(EMPTY_FORM);
  const [shareCoupon, setShareCoupon] = useState<VendorCoupon | null>(null);

  const couponsQuery = useVendorCoupons(page);
  const { data: settings } = useVendorSettings();
  const createCoupon = useCreateVendorCoupon();
  const updateCoupon = useUpdateVendorCoupon();
  const toggleActive = useToggleVendorCouponActive();

  const storeName = settings?.business_name ?? '';
  const storeLogoUrl = resolveMediaUrl(settings?.logo_url);

  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  const modalTitle = editing ? t('vendor.coupons.editTitle') : t('vendor.coupons.createTitle');

  const usageLabel = useMemo(
    () => (coupon: VendorCoupon) =>
      coupon.usage_limit
        ? t('vendor.coupons.usageLimited', {
            used: coupon.used_count,
            limit: coupon.usage_limit,
          })
        : t('vendor.coupons.usageUnlimited', { used: coupon.used_count }),
    [t],
  );

  const existingCodes = useMemo(
    () => (couponsQuery.data?.items ?? []).map((coupon) => coupon.code),
    [couponsQuery.data?.items],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      code: generateUniqueCouponCode(existingCodes),
    });
    setModalOpen(true);
  };

  const openEdit = (coupon: VendorCoupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      value: coupon.value,
      minimum_order: Number(coupon.minimum_order),
      maximum_discount: coupon.maximum_discount ? Number(coupon.maximum_discount) : null,
      starts_at: coupon.starts_at,
      ends_at: coupon.ends_at,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editing) {
        const payload: Partial<VendorCouponPayload> = {
          minimum_order: form.minimum_order,
          maximum_discount: form.maximum_discount,
          starts_at: form.starts_at,
          ends_at: form.ends_at,
          usage_limit: form.usage_limit,
          is_active: form.is_active,
        };

        if (editing.used_count === 0) {
          payload.code = form.code;
          payload.value = form.value;
        }

        await updateCoupon.mutateAsync({ id: editing.id, payload });
        toast.success(t('vendor.coupons.updateSuccess'));
      } else {
        await createCoupon.mutateAsync(form);
        toast.success(t('vendor.coupons.createSuccess'));
      }

      setModalOpen(false);
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleToggle = async (coupon: VendorCoupon) => {
    try {
      await toggleActive.mutateAsync({ id: coupon.id, active: !coupon.is_active });
      toast.success(
        coupon.is_active
          ? t('vendor.coupons.deactivatedSuccess')
          : t('vendor.coupons.activatedSuccess'),
      );
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('vendor.coupons.copySuccess'));
    } catch {
      toast.error(t('vendor.coupons.copyFailed'));
    }
  };

  if (couponsQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (couponsQuery.isError) {
    return (
      <ErrorState
        message={t('vendor.coupons.loadError')}
        onRetry={() => void couponsQuery.refetch()}
      />
    );
  }

  const items = couponsQuery.data?.items ?? [];
  const pagination = couponsQuery.data?.pagination;

  const listFrom = pagination ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
  const listTo = pagination
    ? Math.min(pagination.current_page * pagination.per_page, pagination.total)
    : items.length;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-diyar-cream/60 border border-diyar-brown/10 flex items-center justify-center text-diyar-brown">
              <Tag size={20} />
            </span>
            {t('vendor.coupons.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-2 ps-12">{t('vendor.coupons.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-diyar-brown px-4 py-2.5 text-sm font-bold text-white hover:bg-diyar-brown/90 transition cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          {t('vendor.coupons.createButton')}
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('vendor.coupons.emptyTitle')}
          description={t('vendor.coupons.emptyDescription')}
        />
      ) : (
        <>
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between gap-3 text-sm text-gray-500 px-1">
              <span className="inline-flex items-center gap-2">
                <Sparkles size={14} className="text-diyar-brown/60" />
                {t('vendor.coupons.listSummary', {
                  from: listFrom,
                  to: listTo,
                  total: pagination.total,
                })}
              </span>
              {pagination.last_page > 1 && (
                <span className="tabular-nums font-medium text-gray-600">
                  {pagination.current_page} / {pagination.last_page}
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4">
            {items.map((coupon, index) => (
              <div
                key={coupon.id}
                className="animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
              >
                <VendorCouponCard
                  coupon={coupon}
                  currency={currency}
                  usageLabel={usageLabel(coupon)}
                  t={t}
                  isToggling={toggleActive.isPending}
                  onCopy={(code) => void handleCopy(code)}
                  onShare={setShareCoupon}
                  onEdit={openEdit}
                  onToggle={(item) => void handleToggle(item)}
                />
              </div>
            ))}
          </div>

          {pagination && (
            <PaginationBar
              pagination={pagination}
              page={page}
              onPageChange={setPage}
              className="pt-2"
              alwaysShow={pagination.total > pagination.per_page}
            />
          )}
        </>
      )}

      <VendorCouponFormModal
        open={modalOpen}
        title={modalTitle}
        editing={editing}
        form={form}
        existingCodes={existingCodes}
        currency={currency}
        isSaving={isSaving}
        t={t}
        onClose={() => setModalOpen(false)}
        onChange={setForm}
        onSubmit={(event) => void handleSubmit(event)}
      />

      {shareCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-sm space-y-4">
            <button
              type="button"
              onClick={() => setShareCoupon(null)}
              aria-label={t('common.close')}
              className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-diyar-dark shadow-md flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
            <CouponShareCard
              storeName={storeName}
              storeLogoUrl={storeLogoUrl}
              coupon={shareCoupon}
            />
          </div>
        </div>
      )}
    </div>
  );
}
