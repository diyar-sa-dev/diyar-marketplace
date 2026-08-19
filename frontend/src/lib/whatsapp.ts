import { sanitizeSaudiPhoneInput } from './auth/validation.ts';

/** E.164 digits for wa.me (e.g. 966501234567). */
export function toWhatsAppPhoneDigits(phone: string | null | undefined): string | null {
  if (!phone?.trim()) {
    return null;
  }

  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('00966')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('966')) {
    // already international Saudi
  } else if (digits.startsWith('0')) {
    digits = `966${digits.slice(1)}`;
  } else {
    const national = sanitizeSaudiPhoneInput(phone);
    if (national.length === 9 && national.startsWith('5')) {
      digits = `966${national}`;
    }
  }

  return digits.length >= 11 ? digits : null;
}

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const digits = toWhatsAppPhoneDigits(phone);
  if (!digits) {
    return null;
  }

  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  if (!text) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(text)}`;
}

export function formatInternationalPhone(phone: string | null | undefined): string {
  const digits = toWhatsAppPhoneDigits(phone);
  if (!digits) {
    return phone?.trim() ?? '';
  }

  return `+${digits}`;
}
