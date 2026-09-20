import type { ItemSnapshot } from '../domain/models.ts';

export const TIER3_GLB_PREFIX = 'tier3:';

const ALLOWED = ['http:', 'https:'] as const;

export function isAllowedGlbHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED.includes(parsed.protocol as (typeof ALLOWED)[number]);
  } catch {
    return false;
  }
}

/** Resolve GLB URL for 3D presentation only (browser fetch — no server-side fetch). */
export function resolveGlbAssetUrl(snapshot: ItemSnapshot): string | null {
  const ref = snapshot.asset_ref?.trim();
  if (ref?.startsWith(TIER3_GLB_PREFIX)) {
    const rest = ref.slice(TIER3_GLB_PREFIX.length).trim();
    if (isAllowedGlbHttpUrl(rest)) {
      return rest;
    }
    return null;
  }
  if (ref?.endsWith('.glb') || ref?.endsWith('.gltf')) {
    if (isAllowedGlbHttpUrl(ref)) {
      return ref;
    }
  }
  return null;
}
