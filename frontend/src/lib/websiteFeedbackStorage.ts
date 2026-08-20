const STORAGE_PREFIX = 'diyar:website-feedback:';

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

export function hasSubmittedWebsiteFeedback(userId?: string | null): boolean {
  try {
    return Boolean(localStorage.getItem(storageKey(userId)));
  } catch {
    return false;
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

export function saveWebsiteFeedback(payload: StoredWebsiteFeedback, userId?: string | null): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(payload));
}
