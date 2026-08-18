const SA_PHONE_PATTERN = /^(?:\+966|966|0)?5\d{8}$/;

const URL_PATTERN =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export function normalizeSaPhoneInput(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

export function isValidSaPhone(value: string): boolean {
  const normalized = normalizeSaPhoneInput(value.trim());
  return SA_PHONE_PATTERN.test(normalized);
}

export function isValidOptionalUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return URL_PATTERN.test(trimmed);
  }
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function isDigitsOnly(value: string, minLength = 1): boolean {
  const digits = digitsOnly(value);
  return digits.length >= minLength && digits === value.replace(/\s/g, '');
}
