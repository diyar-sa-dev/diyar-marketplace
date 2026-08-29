import { useEffect, useMemo, useState } from 'react';

export function earliestPromotionEndsAt(
  endsAtValues: Array<string | null | undefined>,
): string | null {
  const now = Date.now();
  let earliest: number | null = null;

  for (const value of endsAtValues) {
    if (!value) {
      continue;
    }

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp) || timestamp <= now) {
      continue;
    }

    if (earliest === null || timestamp < earliest) {
      earliest = timestamp;
    }
  }

  return earliest !== null ? new Date(earliest).toISOString() : null;
}

export function formatCountdownSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function usePromotionCountdown(endsAt: string | null | undefined): number | null {
  const targetMs = useMemo(() => {
    if (!endsAt) {
      return null;
    }

    const timestamp = new Date(endsAt).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }, [endsAt]);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (targetMs === null) {
      return null;
    }

    return Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  });

  useEffect(() => {
    if (targetMs === null) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.floor((targetMs - Date.now()) / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [targetMs]);

  return secondsLeft;
}
