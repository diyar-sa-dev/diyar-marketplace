import {
  isValidSaudiPhoneNational,
  toSaudiPhoneNationalInput,
} from './auth/validation.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DOMAIN_PATTERN =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/;

export function normalizeB2bWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidB2bWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const candidate = normalizeB2bWebsite(trimmed);
  if (!candidate) return false;

  try {
    const parsed = new URL(candidate);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return DOMAIN_PATTERN.test(trimmed.replace(/^https?:\/\//i, ''));
  }
}

export function isValidB2bEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return EMAIL_PATTERN.test(trimmed);
}

export function formatB2bPhoneForApi(nationalPhone: string): string | null {
  const trimmed = nationalPhone.trim();
  if (!trimmed) return null;
  return `966${trimmed}`;
}

export function readB2bPhoneNational(phone: string | null | undefined): string {
  return toSaudiPhoneNationalInput(phone);
}

export function isValidB2bPhone(nationalPhone: string): boolean {
  const trimmed = nationalPhone.trim();
  if (!trimmed) return true;
  return isValidSaudiPhoneNational(trimmed);
}

export const B2B_CATEGORY_OTHER = '__other__';
