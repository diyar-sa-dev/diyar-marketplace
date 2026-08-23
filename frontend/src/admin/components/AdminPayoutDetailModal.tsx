import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Hash,
  Mail,
  Phone,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { AdminStatusBadge } from './AdminStatusBadge.tsx';
import { PermissionGate } from './PermissionGate.tsx';
import type { AdminAffiliatePayout, AdminPayoutKind, AdminVendorPayout, PayoutAction } from '../types/payouts.ts';

type AdminPayoutDetailModalProps = {
  open: boolean;
  kind: AdminPayoutKind;
  payout: AdminVendorPayout | AdminAffiliatePayout | null;
  isActionPending: boolean;
  onClose: () => void;
  onAction: (action: PayoutAction) => void;
};

function formatDateTime(value?: string | null, locale?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-4">
      <div className="mt-0.5 text-diyar-brown">{icon}</div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="mt-1.5 text-sm font-medium text-diyar-dark">{children}</dd>
      </div>
    </div>
  );
}

export function AdminPayoutDetailModal({
  open,
  kind,
  payout,
  isActionPending,
  onClose,
  onAction,
}: AdminPayoutDetailModalProps) {
  const { t, locale } = useLocale();

  if (!open || !payout) {
    return null;
  }

  const isVendor = kind === 'vendor';
  const vendorPayout = isVendor ? (payout as AdminVendorPayout) : null;
  const affiliatePayout = !isVendor ? (payout as AdminAffiliatePayout) : null;

  const recipientName = isVendor
    ? vendorPayout?.vendor?.business_name
    : affiliatePayout?.affiliate?.display_name ?? affiliatePayout?.affiliate?.owner?.name;

  const owner = isVendor ? vendorPayout?.vendor?.owner : affiliatePayout?.affiliate?.owner;

  const bankLabel = isVendor
    ? vendorPayout?.vendor?.bank_account?.beneficiary_name
    : affiliatePayout?.affiliate?.payout_account_holder;

  const bankName = isVendor
    ? vendorPayout?.vendor?.bank_account?.bank_code
    : affiliatePayout?.affiliate?.payout_bank_name;

  const ibanDisplay = isVendor
    ? vendorPayout?.vendor?.bank_account?.iban_last4
      ? `•••• ${vendorPayout.vendor.bank_account.iban_last4}`
      : null
    : affiliatePayout?.affiliate?.payout_iban
      ? `•••• ${affiliatePayout.affiliate.payout_iban.slice(-4)}`
      : null;

  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center bg-black/55 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-detail-title"
      >
        <div className="bg-linear-to-r from-diyar-dark to-[#2d524e] px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                {isVendor ? t('admin.finance.vendorPayouts') : t('admin.finance.affiliatePayouts')}
              </p>
              <h2 id="payout-detail-title" className="mt-1 text-2xl font-extrabold tabular-nums" dir="ltr">
                {payout.amount} {payout.currency}
              </h2>
              <p className="mt-2 font-mono text-sm text-white/75" dir="ltr">
                {payout.reference}
              </p>
              <div className="mt-3">
                <AdminStatusBadge status={payout.status} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              {isVendor ? <Building2 size={18} /> : <User size={18} />}
              <h3 className="font-bold">{t('admin.payouts.recipient')}</h3>
            </div>
            <p className="mt-2 text-lg font-extrabold text-diyar-dark">{recipientName ?? '—'}</p>
            {owner ? (
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <User size={14} className="text-diyar-brown shrink-0" />
                  <span>{owner.name}</span>
                </p>
                {owner.email ? (
                  <p className="flex items-center gap-2" dir="ltr">
                    <Mail size={14} className="text-diyar-brown shrink-0" />
                    <span>{owner.email}</span>
                  </p>
                ) : null}
                {owner.phone ? (
                  <p className="flex items-center gap-2" dir="ltr">
                    <Phone size={14} className="text-diyar-brown shrink-0" />
                    <span>{formatPhoneDisplay(owner.phone)}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {isVendor && vendorPayout?.vendor ? (
                <Link
                  to={`/admin/vendors/${vendorPayout.vendor.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-diyar-dark px-3 py-1.5 text-xs font-bold text-white hover:bg-diyar-brown cursor-pointer"
                >
                  <ExternalLink size={14} />
                  {t('admin.payouts.openVendor')}
                </Link>
              ) : null}
              {owner ? (
                <Link
                  to={`/admin/users/${owner.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                >
                  <ExternalLink size={14} />
                  {t('admin.payouts.openUser')}
                </Link>
              ) : null}
              {!isVendor ? (
                <Link
                  to="/admin/affiliate"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                >
                  <ExternalLink size={14} />
                  {t('admin.payouts.openAffiliateHub')}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon={<Hash size={18} />} label={t('admin.payouts.reference')}>
              <span className="font-mono text-xs" dir="ltr">
                {payout.reference}
              </span>
            </DetailRow>
            <DetailRow icon={<Banknote size={18} />} label={t('admin.tables.amount')}>
              <span className="text-lg font-extrabold text-diyar-brown tabular-nums" dir="ltr">
                {payout.amount} {payout.currency}
              </span>
            </DetailRow>
            <DetailRow icon={<Calendar size={18} />} label={t('admin.payouts.requestedAt')}>
              {formatDateTime(payout.requested_at, locale)}
            </DetailRow>
            <DetailRow icon={<Calendar size={18} />} label={t('admin.payouts.processedAt')}>
              {formatDateTime(payout.processed_at, locale)}
            </DetailRow>
          </div>

          {(bankLabel || bankName || ibanDisplay) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-diyar-dark">
                <Banknote size={18} className="text-diyar-brown" />
                {t('admin.payouts.bankDetails')}
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-gray-400">{t('admin.payouts.accountHolder')}</dt>
                  <dd className="mt-1 font-medium text-diyar-dark">{bankLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-400">{t('admin.payouts.bankName')}</dt>
                  <dd className="mt-1 font-medium text-diyar-dark">{bankName ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-gray-400">{t('admin.payouts.iban')}</dt>
                  <dd className="mt-1 font-mono text-sm text-diyar-dark" dir="ltr">
                    {ibanDisplay ?? '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {payout.rejection_reason ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-bold">{t('admin.payouts.rejectionReason')}</p>
              <p className="mt-1">{payout.rejection_reason}</p>
            </div>
          ) : null}

          {affiliatePayout?.payment_reference ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-bold">{t('admin.payouts.paymentReference')}</p>
              <p className="mt-1 font-mono" dir="ltr">
                {affiliatePayout.payment_reference}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 cursor-pointer"
          >
            {t('common.close')}
          </button>

          {payout.status === 'pending' ? (
            <PermissionGate permission="payouts.approve">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onAction('reject')}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              >
                <XCircle size={16} />
                {t('admin.payouts.reject')}
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onAction('approve')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle size={16} />
                {t('admin.payouts.approve')}
              </button>
            </PermissionGate>
          ) : null}

          {payout.status === 'approved' ? (
            <PermissionGate permission="payouts.process">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onAction(kind === 'affiliate' ? 'mark-processing' : 'mark-paid')}
                className="inline-flex items-center gap-2 rounded-xl bg-diyar-brown px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A67B5B] disabled:opacity-50 cursor-pointer"
              >
                <DollarSign size={16} />
                {kind === 'affiliate' ? t('admin.payouts.markProcessing') : t('admin.payouts.markPaid')}
              </button>
            </PermissionGate>
          ) : null}

          {payout.status === 'processing' && kind === 'affiliate' ? (
            <PermissionGate permission="affiliate.payouts.process">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onAction('mark-paid')}
                className="inline-flex items-center gap-2 rounded-xl bg-diyar-brown px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A67B5B] disabled:opacity-50 cursor-pointer"
              >
                <DollarSign size={16} />
                {t('admin.payouts.markPaid')}
              </button>
            </PermissionGate>
          ) : null}
        </div>
      </div>
    </div>
  );
}
