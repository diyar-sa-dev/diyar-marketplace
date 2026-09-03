import { useEffect, useMemo, useState } from 'react';
import type { TranslateFn } from '../lib/i18n/types.ts';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const DAYS_PER_WEEK = 7;

export type PromotionRemainingDisplay = {
  label: string;
  isClock: boolean;
};

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
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((safeSeconds % SECONDS_PER_HOUR) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPromotionRemaining(
  totalSeconds: number,
  t: TranslateFn,
): PromotionRemainingDisplay | null {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const totalHours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const totalDays = Math.floor(safeSeconds / SECONDS_PER_DAY);

  if (totalDays >= DAYS_PER_WEEK) {
    return null;
  }

  if (totalHours < 24) {
    return { label: formatCountdownSeconds(safeSeconds), isClock: true };
  }

  const days = Math.max(1, totalDays);
  const key = days === 1 ? 'home.featuredDeals.countdownDay' : 'home.featuredDeals.countdownDays';
  return { label: t(key, { count: days }), isClock: false };
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
