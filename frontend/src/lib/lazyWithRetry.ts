import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type ModuleLoader<T extends ComponentType> = () => Promise<{ default: T }>;

const CHUNK_RELOAD_KEY = 'diyar-chunk-reload';

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('chunkloaderror') ||
    message.includes('importing a module script failed')
  );
}

/**
 * Retries dynamic import once after a deployment may have invalidated hashed chunks.
 * Uses sessionStorage to avoid infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType>(
  loader: ModuleLoader<T>,
  chunkId: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      if (!isChunkLoadError(error)) {
        throw error;
      }

      const reloadKey = `${CHUNK_RELOAD_KEY}:${chunkId}`;
      const alreadyReloaded = sessionStorage.getItem(reloadKey) === '1';

      if (!alreadyReloaded && typeof window !== 'undefined') {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        return new Promise(() => {
          /* reload in progress */
        });
      }

      throw error;
    }
  });
}
