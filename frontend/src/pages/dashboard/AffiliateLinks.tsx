import React from 'react';
import { LinkIcon, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import {
  useAffiliateLinks,
  useDeactivateAffiliateLink,
} from '../../hooks/affiliate/useAffiliate.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState, paginationBarProps } from '../../hooks/usePaginationState.ts';
import { useToast } from '../../hooks/useToast.ts';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import { parseApiError } from '../../utils/errors.ts';

export default function AffiliateLinks() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange } = usePaginationState();
  const linksQuery = useAffiliateLinks(page, perPage);
  const deactivateLink = useDeactivateAffiliateLink();

  const handleCopy = async (url?: string) => {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('affiliate.copySuccess'));
    } catch {
      toast.error(t('affiliate.copyFailed'));
    }
  };

  const handleDeactivate = async (linkId: string) => {
    if (!window.confirm(t('affiliate.links.deactivateConfirm'))) {
      return;
    }

    try {
      await deactivateLink.mutateAsync(linkId);
      toast.success(t('affiliate.linkDeactivated'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  if (linksQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (linksQuery.isError) {
    return (
      <ErrorState
        message={t('affiliate.links.loadError')}
        onRetry={() => void linksQuery.refetch()}
      />
    );
  }

  const links = linksQuery.data?.links ?? [];
  const pagination = linksQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">روابطي</h2>
          <p className="text-gray-500 text-sm mt-1">
            تتبع الروابط الخاصة بك وانسخها لمشاركتها مع الجمهور.
          </p>
        </div>
      </div>

      {links.length === 0 ? (
        <EmptyState title={t('affiliate.emptyLinks')} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold">اسم الرابط / المنتج</th>
                    <th className="px-6 py-4 font-bold">الرابط</th>
                    <th className="px-6 py-4 font-bold">النقرات</th>
                    <th className="px-6 py-4 font-bold">التحويلات</th>
                    <th className="px-6 py-4 font-bold">الأرباح</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{link.name}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <LinkIcon size={12} />
                          {link.referral_code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-50 overflow-hidden">
                          <span className="truncate text-gray-500" dir="ltr">
                            {link.public_url ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{link.click_count}</td>
                      <td className="px-6 py-4 font-medium">{link.conversion_count}</td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        {link.total_earnings} {t('common.currency')}
                      </td>
                      <td className="px-6 py-4">
                        {link.is_active ? (
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            نشط
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">
                            متوقف
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => void handleCopy(link.public_url)}
                            className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
                            title="نسخ الرابط"
                          >
                            <Copy size={16} />
                          </button>
                          {link.public_url ? (
                            <a
                              href={link.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition"
                              title="فتح الرابط"
                            >
                              <ExternalLink size={16} />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            disabled={!link.is_active || deactivateLink.isPending}
                            onClick={() => void handleDeactivate(link.id)}
                            className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                            title="إيقاف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && (
            <PaginationBar
              {...paginationBarProps(pagination, {
                page,
                perPage,
                perPageOptions,
                onPageChange,
                onPerPageChange,
              })}
            />
          )}
        </>
      )}
    </div>
  );
}
