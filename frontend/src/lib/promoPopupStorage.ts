const STORAGE_KEY = 'diyar:promo-popup:v1';
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

type PromoPopupState = {
  dismissedAt: number;
  lastAdIndex: number;
};

function readState(): PromoPopupState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PromoPopupState;
    if (typeof parsed.dismissedAt !== 'number' || typeof parsed.lastAdIndex !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeState(state: PromoPopupState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode errors.
  }
}

/** Returns false when the user dismissed the popup within the cooldown window. */
export function shouldShowPromoPopup(now = Date.now()): boolean {
  const state = readState();
  if (!state) {
    return true;
  }
  return now - state.dismissedAt >= DISMISS_TTL_MS;
}

/** Pick the next ad index in rotation (persists between visits). */
export function nextPromoAdIndex(adCount: number, now = Date.now()): number {
  if (adCount <= 0) {
    return 0;
  }

  const state = readState();
  if (!state || now - state.dismissedAt >= DISMISS_TTL_MS) {
    const next = state ? (state.lastAdIndex + 1) % adCount : 0;
    writeState({ dismissedAt: state?.dismissedAt ?? 0, lastAdIndex: next });
    return next;
  }

  return state.lastAdIndex % adCount;
}

export function dismissPromoPopup(adIndex: number, now = Date.now()): void {
  writeState({ dismissedAt: now, lastAdIndex: adIndex });
}
