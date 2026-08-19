/** Strip spaces and uppercase — standard IBAN normalization. */
export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, '').trim().toUpperCase();
}

/** Saudi IBAN: SA + exactly 22 digits (24 characters total), MOD-97 checksum. */
export function isValidSaudiIban(value: string): boolean {
  const iban = normalizeIban(value);

  if (!/^SA\d{22}$/.test(iban)) {
    return false;
  }

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 1) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }

  return remainder === 1;
}

export function saudiIbanValidationMessage(value: string, locale: 'ar' | 'en'): string | null {
  const iban = normalizeIban(value);

  if (!iban) {
    return locale === 'ar' ? 'رقم الآيبان مطلوب.' : 'IBAN is required.';
  }

  if (!iban.startsWith('SA')) {
    return locale === 'ar'
      ? 'يجب أن يبدأ الآيبان السعودي بـ SA.'
      : 'Saudi IBAN must start with SA.';
  }

  if (iban.length !== 24) {
    return locale === 'ar'
      ? `الآيبان السعودي 24 حرفاً (SA + 22 رقماً). المدخل: ${iban.length} حرفاً.`
      : `Saudi IBAN must be 24 characters (SA + 22 digits). You entered ${iban.length}.`;
  }

  if (!/^SA\d{22}$/.test(iban)) {
    return locale === 'ar'
      ? 'بعد SA يجب أن يتكون الآيبان من 22 رقماً فقط.'
      : 'After SA, the IBAN must contain exactly 22 digits.';
  }

  if (!isValidSaudiIban(iban)) {
    return locale === 'ar'
      ? 'رقم الآيبان غير صالح — تحقق من الأرقام (checksum).'
      : 'Invalid IBAN — check the digits (checksum failed).';
  }

  return null;
}
