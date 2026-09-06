/**
 * Normalize backend media URLs for the SPA.
 * Rewrites Laravel `/storage` URLs to same-origin paths so Vite can proxy them.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('/storage/') || trimmed.startsWith('/storage')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.pathname.startsWith('/storage/') || parsed.pathname === '/storage') {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
