import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MousePointerClick, ShoppingCart, DollarSign, Target, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { useAffiliateOverview } from '../../hooks/affiliate/useAffiliate.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { usePortalTheme } from '../../lib/dashboard/portalTheme.ts';

const FALLBACK_IMAGE = '/placeholder-product.png';

export default function AffiliateDashboard() {
  const { t } = useLocale();
  const theme = usePortalTheme();
  const { toast } = useToast();
  const overviewQuery = useAffiliateOverview();

  const chartData = useMemo(() => {
    return (overviewQuery.data?.overview.chart ?? []).map((row) => ({
      name: row.period,
      clicks: row.clicks,
      earnings: Number(row.commission),
      conversions: row.conversions,
    }));
  }, [overviewQuery.data?.overview.chart]);

  const topLinks = overviewQuery.data?.overview.top_links ?? [];

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

  if (overviewQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState message={t('affiliate.loadError')} onRetry={() => void overviewQuery.refetch()} />
    );
  }

  const { overview } = overviewQuery.data;
  const currency = overview.balance.currency ?? t('common.currency');
  const conversionRate = overview.conversion_rate
    ? `${overview.conversion_rate}%`
    : overview.clicks > 0
      ? `${((overview.conversions / overview.clicks) * 100).toFixed(1)}%`
      : '0%';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('affiliate.dashboard.clicksThisMonth')}
            </h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <MousePointerClick size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">
              {overview.clicks.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('affiliate.dashboard.conversions')}</h3>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">
              {overview.conversions.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('affiliate.dashboard.conversionRate')}</h3>
            <div
              className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center`}
            >
              <Target size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{conversionRate}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('affiliate.dashboard.earnedCommissions')}
            </h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{overview.earnings}</span>
            <span className="text-sm font-bold text-diyar-dark mb-1">{currency}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-diyar-dark mb-6">
            {t('affiliate.dashboard.performanceChart')}
          </h3>
          <div className="h-72 w-full min-w-0" dir="ltr">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                {t('affiliate.common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="clicks"
                    name={t('affiliate.dashboard.chartClicks')}
                    fill="#e5e7eb"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="earnings"
                    name={`${t('affiliate.dashboard.chartEarnings')} (${currency})`}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <DollarSign size={28} />
            </div>
            <p className="text-sm text-gray-500 mb-1">
              {t('affiliate.dashboard.withdrawableBalance')}
            </p>
            <h3 className="text-3xl font-bold text-diyar-dark mb-4">
              {overview.balance.available} <span className="text-sm">{currency}</span>
            </h3>
            <Link
              to="/dashboard/affiliate/payouts"
              className="w-full bg-diyar-dark text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition text-center"
            >
              {t('affiliate.dashboard.requestPayout')}
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-diyar-dark mb-4">{t('affiliate.dashboard.topLinks')}</h3>
            <div className="space-y-3">
              {topLinks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {t('affiliate.common.noData')}
                </p>
              ) : (
                topLinks.map((link) => (
                  <div
                    key={link.link_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${theme.text} shadow-sm overflow-hidden`}
                      >
                        <img
                          src={resolveMediaUrl(link.product?.image_url) ?? FALLBACK_IMAGE}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-diyar-dark">{link.name}</p>
                        <p className="text-xs text-gray-500">
                          {link.clicks} {t('affiliate.dashboard.clicksLabel')} · {link.earnings}{' '}
                          {currency}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopy(link.public_url)}
                      className="p-2 text-gray-400 hover:text-diyar-dark transition bg-white rounded-lg shadow-sm"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
