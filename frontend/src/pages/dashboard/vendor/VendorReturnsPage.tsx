import { useState } from 'react';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { useVendorReturnActions, useVendorReturns } from '../../../hooks/dashboard/vendor/useVendorReturns.ts';
import { VendorReturnsSkeleton } from '../../../components/dashboard/vendor/returns/VendorReturnsSkeleton.tsx';
import { EmptyState } from '../../../components/common/EmptyState.tsx';
import type { ReturnRequest } from '../../../types/return.ts';

function effectivePolicy(snapshot: Record<string, unknown>): Record<string, unknown> {
  const effective = snapshot.effective;
  if (effective && typeof effective === 'object') {
    return effective as Record<string, unknown>;
  }
  return snapshot;
}

function ReturnDetailCard({
  item,
  t,
  onAction,
}: {
  item: ReturnRequest;
  t: ReturnType<typeof useLocale>['t'];
  onAction: (
    returnId: string,
    action: 'submit-review' | 'approve' | 'reject' | 'received' | 'inspect' | 'refund',
  ) => void;
}) {
  const policy = effectivePolicy(item.policy_snapshot);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{item.reference}</p>
          <h3 className="font-bold text-diyar-dark">{item.order_number ?? item.order_id}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t(`returns.reason.${item.reason}` as 'returns.reason.damaged')} ·{' '}
            {t(`returns.status.${item.status}` as 'returns.status.requested')}
          </p>
        </div>
        {item.refund?.total_amount && (
          <p className="text-sm font-bold text-diyar-brown tabular-nums">
            {item.refund.total_amount} {item.refund.currency}
          </p>
        )}
      </div>

      {item.items && item.items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">{t('returns.detailItems')}</p>
          <ul className="space-y-1 text-sm">
            {item.items.map((line) => (
              <li key={line.id} className="flex justify-between gap-2">
                <span>{line.product_name ?? line.order_item_id}</span>
                <span className="tabular-nums font-bold">
                  × {line.quantity} · {line.line_subtotal}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
        <p className="font-bold text-gray-700">{t('returns.detailPolicy')}</p>
        <p>
          {t('returns.policyWindowDays')}: {String(policy.return_window_days ?? '—')}
        </p>
        <p>
          {t('returns.policyRequiresEvidence')}:{' '}
          {policy.requires_evidence ? t('common.yes') : t('common.no')}
        </p>
      </div>

      {item.evidence && item.evidence.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">{t('returns.detailEvidence')}</p>
          <ul className="text-xs text-diyar-brown space-y-1">
            {item.evidence.map((file) => (
              <li key={file.id}>
                {file.url ? (
                  <a href={file.url} target="_blank" rel="noreferrer" className="underline">
                    {file.original_name}
                  </a>
                ) : (
                  file.original_name
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.refund && (
        <div className="text-xs text-gray-600">
          <p className="font-bold text-gray-700">{t('returns.detailRefund')}</p>
          <p className="tabular-nums">
            {item.refund.items_subtotal} + VAT {item.refund.vat_amount}
            {Number(item.refund.shipping_amount) > 0 ? ` + shipping ${item.refund.shipping_amount}` : ''}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {item.status === 'requested' && (
          <button
            type="button"
            onClick={() => onAction(item.id, 'submit-review')}
            className="rounded-lg bg-diyar-dark px-3 py-2 text-xs font-bold text-white"
          >
            {t('returns.actions.submitReview')}
          </button>
        )}
        {item.status === 'under_review' && (
          <>
            <button
              type="button"
              onClick={() => onAction(item.id, 'approve')}
              className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white"
            >
              {t('returns.actions.approve')}
            </button>
            <button
              type="button"
              onClick={() => onAction(item.id, 'reject')}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white"
            >
              {t('returns.actions.reject')}
            </button>
          </>
        )}
        {item.status === 'awaiting_return' && (
          <button
            type="button"
            onClick={() => onAction(item.id, 'received')}
            className="rounded-lg bg-diyar-brown px-3 py-2 text-xs font-bold text-white"
          >
            {t('returns.actions.received')}
          </button>
        )}
        {item.status === 'received' && (
          <button
            type="button"
            onClick={() => onAction(item.id, 'inspect')}
            className="rounded-lg bg-diyar-brown px-3 py-2 text-xs font-bold text-white"
          >
            {t('returns.actions.inspect')}
          </button>
        )}
        {item.status === 'inspected' && (
          <button
            type="button"
            onClick={() => onAction(item.id, 'refund')}
            className="rounded-lg bg-diyar-dark px-3 py-2 text-xs font-bold text-white"
          >
            {t('returns.actions.refund')}
          </button>
        )}
      </div>
    </article>
  );
}

export default function VendorReturnsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useVendorReturns(status);
  const actions = useVendorReturnActions();

  const handleAction = async (
    returnId: string,
    action: 'submit-review' | 'approve' | 'reject' | 'received' | 'inspect' | 'refund',
  ) => {
    try {
      const body =
        action === 'refund'
          ? { idempotency_key: `refund-${returnId}-${Date.now()}` }
          : undefined;
      await actions.mutateAsync({ returnId, action, body });
      toast.success(t('returns.actionSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.unexpected'));
    }
  };

  if (isLoading) {
    return <VendorReturnsSkeleton />;
  }

  const returns = data?.returns ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-diyar-dark">{t('returns.vendorTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('returns.vendorSubtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {['all', 'requested', 'under_review', 'awaiting_return', 'received', 'inspected', 'refunded'].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap cursor-pointer transition ${
                status === tab
                  ? 'bg-diyar-brown text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-diyar-brown/40'
              }`}
            >
              {t(`returns.status.${tab}` as 'returns.status.all')}
            </button>
          ),
        )}
      </div>

      {returns.length === 0 ? (
        <EmptyState title={t('returns.emptyVendor')} />
      ) : (
        <div className="space-y-4">
          {returns.map((item) => (
            <ReturnDetailCard key={item.id} item={item} t={t} onAction={(id, action) => void handleAction(id, action)} />
          ))}
        </div>
      )}
    </div>
  );
}
