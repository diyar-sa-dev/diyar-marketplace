/**
 * Normalize backend media URLs for the SPA.
 * In dev, Vite proxies `/storage` to Laravel so images load same-origin.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith('/storage/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }

  return url;
}
