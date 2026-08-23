/** Strip non-digits and leading zeros for price filter inputs. */
export function sanitizePriceDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return String(Number(digits));
}

export function parsePriceDigits(value: string): number | undefined {
  const sanitized = sanitizePriceDigits(value);
  if (!sanitized) {
    return undefined;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
