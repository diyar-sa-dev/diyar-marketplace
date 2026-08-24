const CHUNK_RELOAD_KEY = 'diyar:chunk-reload';

function isChunkLoadError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');

  return /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|MIME type/i.test(
    message,
  );
}

function reloadOnceForStaleChunks(): void {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
}

export function registerDeployRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForStaleChunks();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) {
      return;
    }

    event.preventDefault();
    reloadOnceForStaleChunks();
  });
}

export function clearDeployRecoveryFlag(): void {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}
