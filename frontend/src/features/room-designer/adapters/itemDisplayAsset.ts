import type { ItemSnapshot } from '../domain/models.ts';
import type { RoomProjectionMode } from '../renderer/projectionMode.ts';

/** Stable prefix for Tier-2 (2.5D) asset references in item snapshots. */
export const TIER2_ASSET_PREFIX = 'tier2:';

const ALLOWED_TIER2_PROTOCOLS = ['http:', 'https:'] as const;

/** Presentation-only URL gate (no image fetch in 30.14 — blocks dangerous schemes). */
export function isAllowedTier2HttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_TIER2_PROTOCOLS.includes(parsed.protocol as (typeof ALLOWED_TIER2_PROTOCOLS)[number]);
  } catch {
    return false;
  }
}

function pickHttpUrl(candidate: string | null | undefined): string | null {
  if (candidate == null || candidate.trim() === '') {
    return null;
  }
  return isAllowedTier2HttpUrl(candidate) ? candidate.trim() : null;
}

/**
 * Resolve raster URL for renderer (presentation). Domain snapshot unchanged.
 * Asset-driven: tier2 ref or thumbnail when in 2.5D mode.
 */
export function resolveItemRenderImageUrl(
  snapshot: ItemSnapshot,
  mode: RoomProjectionMode,
): string | null {
  if (mode !== 'isometric_25d') {
    return null;
  }

  const ref = snapshot.asset_ref?.trim();
  if (ref?.startsWith(TIER2_ASSET_PREFIX)) {
    const rest = ref.slice(TIER2_ASSET_PREFIX.length).trim();
    const direct = pickHttpUrl(rest);
    if (direct) {
      return direct;
    }
    return pickHttpUrl(snapshot.thumbnail_url ?? null);
  }

  return pickHttpUrl(snapshot.thumbnail_url ?? null);
}
