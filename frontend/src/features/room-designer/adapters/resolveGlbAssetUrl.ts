import type { ItemSnapshot } from '../domain/models.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';

export const TIER3_GLB_PREFIX = 'tier3:';

const ALLOWED = ['http:', 'https:'] as const;

export function isAllowedGlbHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmed, base);
    return ALLOWED.includes(parsed.protocol as (typeof ALLOWED)[number]);
  } catch {
    return false;
  }
}

/** Resolve GLB URL for 3D presentation only (browser fetch — no server-side fetch). */
export function resolveGlbAssetUrl(snapshot: ItemSnapshot): string | null {
  const candidate = (snapshot.model_3d_url ?? snapshot.asset_ref)?.trim();
  if (!candidate) return null;

  let raw = candidate;
  if (raw.startsWith(TIER3_GLB_PREFIX)) {
    raw = raw.slice(TIER3_GLB_PREFIX.length).trim();
  }

  const resolved = resolveMediaUrl(raw) ?? raw;
  if (
    resolved.endsWith('.glb') ||
    resolved.endsWith('.gltf') ||
    /\.gl(b|tf)(\?.*)?$/i.test(resolved)
  ) {
    if (isAllowedGlbHttpUrl(resolved)) {
      return resolved;
    }
  }
  return null;
}
