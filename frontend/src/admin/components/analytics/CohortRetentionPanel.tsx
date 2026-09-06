import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '../../../components/common/ChartContainer.tsx';
import { AnalyticsEmptyState } from '../../../components/dashboard/analytics/AnalyticsEmptyState.tsx';
import { useLocale } from '../../../hooks/useLocale.ts';
import { formatCohortMonth, formatCohortMonthShort } from '../../../lib/formatCohortMonth.ts';
import { formatLocaleNumber } from '../../../lib/intlLocale.ts';

const CHART_COLORS = ['#8B4513', '#C4A484', '#5C4033', '#A0522D', '#6B4423', '#D2691E'];

export type CohortRow = {
  cohortMonth: string;
  customers: Record<number, number>;
};

type CohortRetentionPanelProps = {
  rows: CohortRow[];
  monthCount: number;
};

function retentionPercent(count: number, baseline: number): number {
  if (baseline <= 0) {
    return count > 0 ? 100 : 0;
  }
  return Math.round((count / baseline) * 100);
}

export function CohortRetentionPanel({ rows, monthCount }: CohortRetentionPanelProps) {
  const { t, locale } = useLocale();

  const offsets = useMemo(
    () => Array.from({ length: monthCount }, (_, index) => index),
    [monthCount],
  );

  const returningOffsets = useMemo(() => offsets.filter((offset) => offset > 0), [offsets]);

  const chartData = useMemo(
    () =>
      offsets.map((offset) => {
        const point: Record<string, number | string> = {
          offset,
          label: t('admin.analytics.sections.cohorts.monthOffset', { offset }),
        };

        for (const row of rows) {
          const baseline = row.customers[0] ?? 0;
          const count = row.customers[offset] ?? 0;
          point[row.cohortMonth] = retentionPercent(count, baseline);
        }

        return point;
      }),
    [offsets, rows, t],
  );

  const hasChartActivity = rows.some((row) => (row.customers[0] ?? 0) > 0);

  if (rows.length === 0) {
    return (
      <AnalyticsEmptyState
        title={t('admin.analytics.sections.cohorts.emptyTitle')}
        description={t('admin.analytics.sections.cohorts.emptyDescription')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-diyar-dark">
          {t('admin.analytics.sections.cohorts.retentionChart')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('admin.analytics.sections.cohorts.retentionChartHint')}
        </p>
        <div
          className="mt-4 h-72 min-w-0 animate-in rounded-2xl border border-gray-100 bg-linear-to-b from-white to-[#faf8f6] p-3 duration-500 fade-in"
          dir="ltr"
        >
          {hasChartActivity ? (
            <ChartContainer height={288}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string, item) => {
                    const offset = item.payload?.offset as number | undefined;
                    const formattedName = formatCohortMonthShort(name, locale);
                    const row = rows.find((entry) => entry.cohortMonth === name);
                    const count = row?.customers[offset ?? 0] ?? 0;
                    const isBaseline = offset === 0;

                    return [
                      isBaseline
                        ? `${formatLocaleNumber(count, locale)} ${t('admin.analytics.sections.cohorts.newCustomers')} · ${value}%`
                        : `${value}% · ${formatLocaleNumber(count, locale)} ${t('admin.analytics.sections.cohorts.customersShort')}`,
                      formattedName,
                    ];
                  }}
                  labelFormatter={(label) =>
                    t('admin.analytics.sections.cohorts.tooltipOffset', { label })
                  }
                />
                <Legend
                  formatter={(value) => formatCohortMonthShort(value, locale)}
                  wrapperStyle={{ fontSize: 12 }}
                />
                {rows.map((row, index) => (
                  <Line
                    key={row.cohortMonth}
                    type="monotone"
                    dataKey={row.cohortMonth}
                    name={row.cohortMonth}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
              {t('admin.analytics.sections.cohorts.chartEmpty')}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-diyar-dark">
          {t('admin.analytics.sections.cohorts.retentionTable')}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {t('admin.analytics.sections.cohorts.retentionTableHint')}
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90 text-xs uppercase tracking-wide text-gray-500">
                <th
                  rowSpan={2}
                  className="min-w-36 border-e border-gray-200 px-4 py-3 text-start align-bottom font-semibold normal-case"
                >
                  {t('admin.analytics.sections.cohorts.cohortMonth')}
                </th>
                <th
                  colSpan={1}
                  className="border-e border-gray-200 bg-emerald-50/80 px-3 py-2 text-center font-bold text-emerald-800"
                >
                  {t('admin.analytics.sections.cohorts.headerNewGroup')}
                </th>
                {returningOffsets.length > 0 ? (
                  <th
                    colSpan={returningOffsets.length}
                    className="bg-sky-50/80 px-3 py-2 text-center font-bold text-sky-800"
                  >
                    {t('admin.analytics.sections.cohorts.headerReturningGroup')}
                  </th>
                ) : null}
              </tr>
              <tr className="border-b border-gray-200 bg-white text-gray-600">
                <th className="border-e border-gray-100 bg-emerald-50/40 px-3 py-2.5 text-center font-semibold">
                  <span className="block text-sm text-diyar-dark">
                    {t('admin.analytics.sections.cohorts.monthOffset', { offset: 0 })}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-normal text-emerald-700">
                    {t('admin.analytics.sections.cohorts.baselinePercent')}
                  </span>
                </th>
                {returningOffsets.map((offset) => (
                  <th
                    key={offset}
                    className="border-e border-gray-100 bg-sky-50/30 px-3 py-2.5 text-center font-semibold last:border-e-0"
                  >
                    <span className="block text-sm text-diyar-dark">
                      {t('admin.analytics.sections.cohorts.monthOffset', { offset })}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-normal text-sky-700">
                      {t('admin.analytics.sections.cohorts.retentionOfBaseline')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const baseline = row.customers[0] ?? 0;

                return (
                  <tr key={row.cohortMonth} className="border-b border-gray-50 last:border-b-0">
                    <td className="border-e border-gray-100 bg-gray-50/30 px-4 py-3 align-top">
                      <span className="block font-semibold text-diyar-dark">
                        {formatCohortMonth(row.cohortMonth, locale)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400" dir="ltr">
                        {row.cohortMonth}
                      </span>
                      {baseline > 0 ? (
                        <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {t('admin.analytics.sections.cohorts.cohortSize', {
                            count: formatLocaleNumber(baseline, locale),
                          })}
                        </span>
                      ) : null}
                    </td>
                    {offsets.map((offset) => {
                      const count = row.customers[offset] ?? 0;
                      const percent = retentionPercent(count, baseline);
                      const isBaseline = offset === 0;
                      const intensity = baseline > 0 ? Math.min(count / baseline, 1) : 0;

                      return (
                        <td
                          key={offset}
                          className={`px-3 py-3 text-center align-top ${
                            isBaseline
                              ? 'border-e border-gray-100 bg-emerald-50/20'
                              : 'border-e border-gray-100 bg-sky-50/10 last:border-e-0'
                          }`}
                        >
                          <div
                            className={`mx-auto inline-flex min-w-16 flex-col items-center rounded-xl px-2.5 py-2 tabular-nums ${
                              isBaseline ? 'ring-1 ring-emerald-100' : 'ring-1 ring-sky-100'
                            }`}
                            style={{
                              backgroundColor: isBaseline
                                ? `rgba(16, 185, 129, ${0.08 + intensity * 0.18})`
                                : `rgba(14, 165, 233, ${0.06 + intensity * 0.2})`,
                            }}
                            dir="ltr"
                          >
                            <span className="text-base font-bold text-diyar-dark">
                              {formatLocaleNumber(count, locale)}
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                isBaseline ? 'text-emerald-700' : 'text-sky-700'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
