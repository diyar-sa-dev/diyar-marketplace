import React from 'react';
import { LinkIcon, Copy, ExternalLink, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import {
  useAffiliateLinks,
  useDeactivateAffiliateLink,
} from '../../hooks/affiliate/useAffiliate.ts';
import { useStartChat } from '../../hooks/chat/useStartChat.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState, paginationBarProps } from '../../hooks/usePaginationState.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { AffiliateLink } from '../../types/affiliate.ts';

function linkStatusLabel(link: AffiliateLink, t: (key: string) => string): string {
  if (link.is_active) {
    return t('affiliate.links.statusActive');
  }

  if (link.inactive_reason === 'product_disabled' || link.product_affiliate_enabled === false) {
    return t('affiliate.links.statusStoppedProduct');
  }

  return t('affiliate.links.statusStopped');
}

function linkStatusClass(link: AffiliateLink): string {
  if (link.is_active) {
    return 'bg-green-100 text-green-700';
  }

  if (link.inactive_reason === 'product_disabled' || link.product_affiliate_enabled === false) {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-gray-100 text-gray-600';
}

export default function AffiliateLinks() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const { startVendorChat, isStarting: isStartingChat } = useStartChat();
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

  const handleChatVendor = async (link: AffiliateLink) => {
    const vendorAccountId = link.product?.vendor_account_id;
    if (!vendorAccountId) {
      return;
    }

    await startVendorChat(vendorAccountId, {
      subject: link.product?.name ?? link.name,
      context_type: 'affiliate_link',
      context_id: link.id,
      returnPath: '/dashboard/affiliate/links',
    });
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
          <h2 className="text-2xl font-bold text-diyar-dark">{t('affiliate.links.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('affiliate.links.subtitle')}</p>
        </div>
      </div>

      {links.length === 0 ? (
        <EmptyState title={t('affiliate.emptyLinks')} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold">{t('affiliate.reports.tableLink')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.reports.tableSource')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.links.tableUrl')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.links.tableClicks')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.links.tableConversions')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.links.tableEarnings')}</th>
                    <th className="px-6 py-4 font-bold">{t('affiliate.reports.tableStatus')}</th>
                    <th className="px-6 py-4 font-bold text-center">{t('affiliate.links.tableActions')}</th>
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
                        {link.source ? (
                          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {t(`affiliate.sources.${link.source}` as 'affiliate.sources.instagram')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">{t('affiliate.common.noData')}</span>
                        )}
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
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${linkStatusClass(link)}`}
                        >
                          {linkStatusLabel(link, t)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => void handleCopy(link.public_url)}
                            className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition cursor-pointer"
                            title={t('affiliate.links.copyLink')}
                          >
                            <Copy size={16} />
                          </button>
                          {link.public_url && link.is_active ? (
                            <a
                              href={link.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition cursor-pointer"
                              title={t('affiliate.links.openLink')}
                            >
                              <ExternalLink size={16} />
                            </a>
                          ) : null}
                          {link.product?.vendor_account_id ? (
                            <button
                              type="button"
                              disabled={isStartingChat}
                              onClick={() => void handleChatVendor(link)}
                              className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                              title={t('affiliate.links.chatVendor')}
                            >
                              {isStartingChat ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <MessageSquare size={16} />
                              )}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!link.is_active || deactivateLink.isPending}
                            onClick={() => void handleDeactivate(link.id)}
                            className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            title={t('affiliate.links.deactivate')}
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
