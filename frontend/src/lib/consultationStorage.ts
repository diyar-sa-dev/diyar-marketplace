const STORAGE_PREFIX = 'diyar:consultation-request:';

export type StoredConsultationRequest = {
  name: string;
  phone: string;
  email: string;
  message: string;
  submittedAt: string;
};

function storageKey(userId?: string | null): string {
  if (userId) {
    return `${STORAGE_PREFIX}user:${userId}`;
  }

  return `${STORAGE_PREFIX}guest`;
}

export function hasSubmittedConsultationRequest(userId?: string | null): boolean {
  try {
    return Boolean(localStorage.getItem(storageKey(userId)));
  } catch {
    return false;
  }
}

export function saveConsultationRequest(
  payload: StoredConsultationRequest,
  userId?: string | null,
): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(payload));
}
