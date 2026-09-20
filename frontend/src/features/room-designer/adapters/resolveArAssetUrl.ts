const TIER4_PREFIX = 'tier4:';

export function isAllowedArHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Stage 30.17 — USDZ / AR assets (`tier4:` prefix). Browser loads directly. */
export function resolveArAssetUrl(assetRef: string | null | undefined): string | null {
  if (!assetRef || typeof assetRef !== 'string') return null;
  if (!assetRef.startsWith(TIER4_PREFIX)) return null;
  const url = assetRef.slice(TIER4_PREFIX.length).trim();
  if (!url || !isAllowedArHttpUrl(url)) return null;
  return url;
}
