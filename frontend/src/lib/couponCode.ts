const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCouponCode(length = 8): string {
  const size = Math.min(9, Math.max(6, length));
  let code = '';
  const random = crypto.getRandomValues(new Uint32Array(size));
  for (let index = 0; index < size; index += 1) {
    code += CODE_CHARS[random[index]! % CODE_CHARS.length];
  }
  return code;
}

export function generateUniqueCouponCode(existingCodes: Iterable<string>, length = 8): string {
  const taken = new Set(Array.from(existingCodes, (code) => code.trim().toUpperCase()));
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidate = generateCouponCode(length);
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  return generateCouponCode(9);
}

export function sanitizeCouponCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 9);
}

export function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}
