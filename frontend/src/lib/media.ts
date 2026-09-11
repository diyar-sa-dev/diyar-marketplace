import { env } from './env.ts';

/**
 * Normalize backend media URLs for the SPA.
 * Rewrites Laravel `/storage` URLs to same-origin paths (Vite/nginx proxy) or to
 * `VITE_BACKEND_URL` when the frontend is hosted on a separate origin.
 */
function toPublicStorageUrl(pathname: string, search = ''): string {
  const relative = `${pathname}${search}`;
  const backendUrl = env.backendUrl.replace(/\/$/, '');

  return backendUrl ? `${backendUrl}${relative}` : relative;
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('//');
}

function bareMediaPath(value: string): string | null {
  if (value.includes('://') || value.startsWith('/')) {
    return null;
  }

  const normalized = value.replace(/^media\//, '');

  return `/storage/media/${normalized}`;
}

export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('/storage/') || trimmed.startsWith('/storage')) {
    return toPublicStorageUrl(trimmed);
  }

  const barePath = bareMediaPath(trimmed);
  if (barePath) {
    return toPublicStorageUrl(barePath);
  }

  if (isExternalUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
      if (parsed.pathname.startsWith('/storage/') || parsed.pathname === '/storage') {
        return toPublicStorageUrl(`${parsed.pathname}${parsed.search}`);
      }
    } catch {
      return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    }

    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  }

  try {
    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (parsed.pathname.startsWith('/storage/') || parsed.pathname === '/storage') {
      return toPublicStorageUrl(`${parsed.pathname}${parsed.search}`);
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
