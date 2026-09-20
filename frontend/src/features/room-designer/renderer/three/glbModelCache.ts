import type { Group } from 'three';

const MAX_ENTRIES = 32;

const cache = new Map<string, Promise<Group>>();

export function getCachedGlbLoad(key: string): Promise<Group> | undefined {
  return cache.get(key);
}

export function setCachedGlbLoad(key: string, promise: Promise<Group>): void {
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const first = cache.keys().next().value;
    if (first) {
      cache.delete(first);
    }
  }
  cache.set(key, promise);
}

export function clearGlbModelCache(): void {
  cache.clear();
}

/** Test-only */
export function glbCacheSize(): number {
  return cache.size;
}
