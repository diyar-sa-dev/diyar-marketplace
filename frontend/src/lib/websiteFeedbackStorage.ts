import { randomUUID } from './randomUUID.ts';

const STORAGE_PREFIX = 'diyar:website-feedback:';
const GUEST_KEY_STORAGE = `${STORAGE_PREFIX}guest-key`;

export type WebsiteFeedbackType = 'general' | 'search' | 'checkout' | 'design' | 'bug';

export type StoredWebsiteFeedback = {
  rating: number;
  type: WebsiteFeedbackType;
  message: string;
  submittedAt: string;
};

function storageKey(userId?: string | null): string {
  if (userId) {
    return `${STORAGE_PREFIX}user:${userId}`;
  }
  return `${STORAGE_PREFIX}guest`;
}

export function getOrCreateWebsiteFeedbackGuestKey(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY_STORAGE);
    if (existing) {
      return existing;
    }

    const key = randomUUID();
    localStorage.setItem(GUEST_KEY_STORAGE, key);
    return key;
  } catch {
    return randomUUID();
  }
}

export function hasSubmittedWebsiteFeedback(userId?: string | null): boolean {
  try {
    return Boolean(localStorage.getItem(storageKey(userId)));
  } catch {
    return false;
  }
}

export function markWebsiteFeedbackSubmitted(
  payload: StoredWebsiteFeedback,
  userId?: string | null,
): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // Ignore storage failures — API is source of truth.
  }
}

export function readWebsiteFeedback(userId?: string | null): StoredWebsiteFeedback | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredWebsiteFeedback;
  } catch {
    return null;
  }
}

/** @deprecated Prefer submitWebsiteFeedback() API — kept for backwards compatibility. */
export function saveWebsiteFeedback(payload: StoredWebsiteFeedback, userId?: string | null): void {
  markWebsiteFeedbackSubmitted(payload, userId);
}
