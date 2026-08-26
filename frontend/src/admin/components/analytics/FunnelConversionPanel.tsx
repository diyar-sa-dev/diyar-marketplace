import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminFunnelStage } from '../../../api/adminAnalytics.ts';
import { ChartContainer } from '../../../components/common/ChartContainer.tsx';
import { useLocale } from '../../../hooks/useLocale.ts';
import { formatLocaleNumber } from '../../../lib/intlLocale.ts';

const BAR_COLORS = ['#8B4513', '#9B5523', '#A8652B', '#B57533', '#C1853B', '#D29543'];

type FunnelConversionPanelProps = {
  stages: AdminFunnelStage[];
  periodFrom: string;
  periodTo: string;
  dateSeparator: string;
};

function resolveFunnelStageNote(
  stageKey: string,
  rawNote: string | null | undefined,
  t: (key: string) => string,
) {
  if (!rawNote) {
    return null;
  }

  if (stageKey === 'checkout_started') {
    return t('admin.analytics.sections.funnel.stageNotes.checkout_started');
  }

  return null;
}

export function FunnelConversionPanel({
  stages,
  periodFrom,
  periodTo,
  dateSeparator,
}: FunnelConversionPanelProps) {
  const { t, locale } = useLocale();

  const maxCount = useMemo(() => Math.max(...stages.map((stage) => stage.count), 1), [stages]);

  const chartData = useMemo(
    () =>
      stages.map((stage, index) => ({
        key: stage.key,
        index,
        label: t(`admin.analytics.sections.funnel.stages.${stage.key}`),
        count: stage.count,
        conversion: stage.conversion_from_previous ?? null,
        available: stage.available,
      })),
    [stages, t],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-diyar-dark">
            {t('admin.analytics.sections.funnel.funnelChart')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('admin.analytics.sections.funnel.funnelChartHint')}
          </p>
        </div>
        <p
          className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600"
          dir="ltr"
        >
          <span className="tabular-nums">
            {periodFrom} {dateSeparator} {periodTo}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="h-80 min-w-0 rounded-2xl border border-gray-100 bg-linear-to-b from-white to-[#faf8f6] p-3 sm:p-4">
            <ChartContainer height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={locale === 'ar' ? -25 : -20}
                  textAnchor="end"
                  height={72}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="count"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => formatLocaleNumber(value, locale)}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'count') {
                      return [
                        formatLocaleNumber(value, locale),
                        t('admin.analytics.sections.funnel.volume'),
                      ];
                    }
                    return [`${value}%`, t('admin.analytics.sections.funnel.conversionRate')];
                  }}
                  labelFormatter={(label) => label}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6' }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={entry.available ? BAR_COLORS[index % BAR_COLORS.length] : '#d1d5db'}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="conversion"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#059669' }}
                  connectNulls={false}
                  isAnimationActive
                  animationDuration={900}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        </div>

        <div className="xl:col-span-2">
          <h3 className="text-base font-bold text-diyar-dark">
            {t('admin.analytics.sections.funnel.stageBreakdown')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('admin.analytics.sections.funnel.stageBreakdownHint')}
          </p>

          <div className="mt-4 space-y-3">
            {stages.map((stage, index) => {
              const widthPercent = Math.max(
                (stage.count / maxCount) * 100,
                stage.count > 0 ? 6 : 2,
              );
              const stageNote = resolveFunnelStageNote(stage.key, stage.note, t);

              return (
                <div
                  key={stage.key}
                  className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-diyar-brown/10 text-xs font-bold text-diyar-brown">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-diyar-dark">
                        {t(`admin.analytics.sections.funnel.stages.${stage.key}`)}
                      </span>
                      {!stage.available ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {t('admin.analytics.sections.funnel.unavailable')}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 tabular-nums" dir="ltr">
                      <span className="font-bold text-diyar-dark">
                        {formatLocaleNumber(stage.count, locale)}
                      </span>
                      {stage.conversion_from_previous != null ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {t('admin.analytics.sections.funnel.conversion', {
                            rate: stage.conversion_from_previous,
                          })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        stage.available ? 'bg-diyar-brown' : 'bg-gray-300'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  {stageNote ? (
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500">
                      <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                      {stageNote}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
