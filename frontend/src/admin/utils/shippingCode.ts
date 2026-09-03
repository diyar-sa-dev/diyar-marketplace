export function slugifyShippingCode(value: string, fallbackPrefix = 'code'): string {
  const trimmed = value.trim();
  const ascii = trimmed
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (ascii) {
    return ascii.slice(0, 64);
  }

  if (!trimmed) {
    return '';
  }

  let hash = 2166136261;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const suffix = (hash >>> 0).toString(36);
  return `${fallbackPrefix}-${suffix}`.slice(0, 64);
}
