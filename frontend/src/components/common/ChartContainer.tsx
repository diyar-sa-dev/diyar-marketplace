import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

export const CHART_HEIGHT = 288;

type ChartContainerProps = {
  children: ReactElement;
  className?: string;
  height?: number;
};

export function ChartContainer({
  children,
  className = '',
  height = CHART_HEIGHT,
}: ChartContainerProps) {
  return (
    <div className={`w-full min-w-0 ${className}`} style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
