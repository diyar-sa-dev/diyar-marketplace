import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

export const CHART_HEIGHT = 288;

type ChartContainerProps = {
  children: ReactElement;
  className?: string;
  height?: number;
  fill?: boolean;
  minHeight?: number;
};

export function ChartContainer({
  children,
  className = '',
  height = CHART_HEIGHT,
  fill = false,
  minHeight = 280,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState({ width: 0, height: minHeight });

  useEffect(() => {
    if (!fill) {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = Math.max(element.clientHeight, minHeight);
      if (nextWidth > 0 && nextHeight > 0) {
        setMeasured({ width: nextWidth, height: nextHeight });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [fill, minHeight]);

  if (fill) {
    return (
      <div
        ref={containerRef}
        className={`w-full min-w-0 min-h-0 flex-1 ${className}`}
        style={{ minHeight }}
        dir="ltr"
      >
        {measured.width > 0 && measured.height > 0 ? (
          <ResponsiveContainer width={measured.width} height={measured.height}>
            {children}
          </ResponsiveContainer>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 ${className}`} style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
