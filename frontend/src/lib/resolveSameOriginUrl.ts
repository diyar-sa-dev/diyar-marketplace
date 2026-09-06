/**
 * Rewrites an absolute backend redirect URL onto the current browser origin.
 * Prevents session loss when FRONTEND_URL is localhost but the user opened the app via LAN IP.
 */
export function resolveSameOriginUrl(url: string): URL {
  const parsed = new URL(url, window.location.origin);

  return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, window.location.origin);
}
