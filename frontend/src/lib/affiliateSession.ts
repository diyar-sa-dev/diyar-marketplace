import { randomUUID } from './randomUUID.ts';

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

  const fingerprint = existing ?? randomUUID();

  if (!existing) {
    window.localStorage.setItem(AFFILIATE_SESSION_STORAGE_KEY, fingerprint);
  }

  return fingerprint;
}

export { AFFILIATE_SESSION_STORAGE_KEY };
