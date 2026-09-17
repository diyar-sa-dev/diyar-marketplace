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

/** Keep "from" (min) at or below the current "to" (max) value. */
export function clampMinPriceInput(value: string, maxPrice: string): string {
  const min = parsePriceDigits(value);
  const max = parsePriceDigits(maxPrice);
  if (min === undefined || max === undefined || min <= max) {
    return value;
  }

  return String(max);
}

/** Keep "to" (max) at or above the current "from" (min) value. */
export function clampMaxPriceInput(value: string, minPrice: string): string {
  const min = parsePriceDigits(minPrice);
  const max = parsePriceDigits(value);
  if (max === undefined || min === undefined || max >= min) {
    return value;
  }

  return String(min);
}
