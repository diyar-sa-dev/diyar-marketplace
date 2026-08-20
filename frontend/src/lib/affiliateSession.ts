const AFFILIATE_SESSION_STORAGE_KEY = 'affiliate_session';

export function getAffiliateSessionFingerprint(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AFFILIATE_SESSION_STORAGE_KEY);
}

export function getOrCreateAffiliateSessionFingerprint(): string {
  const existing = getAffiliateSessionFingerprint();
  if (existing) {
    return existing;
  }

  const fingerprint =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  window.localStorage.setItem(AFFILIATE_SESSION_STORAGE_KEY, fingerprint);
  return fingerprint;
}

export { AFFILIATE_SESSION_STORAGE_KEY };
