import { describe, expect, it, beforeEach } from 'vitest';
import { isChunkLoadError } from './lazyWithRetry.ts';

describe('lazyWithRetry chunk detection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('detects chunk load errors', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Loading chunk 123 failed'))).toBe(true);
    expect(isChunkLoadError(new Error('ChunkLoadError: missing'))).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true);
    expect(isChunkLoadError(new Error('network timeout'))).toBe(false);
    expect(isChunkLoadError('string error')).toBe(false);
  });

  it('uses sessionStorage guard to prevent infinite reload loops', () => {
    const reloadKey = 'diyar-chunk-reload:marketplace-shell';
    expect(sessionStorage.getItem(reloadKey)).toBeNull();

    sessionStorage.setItem(reloadKey, '1');
    expect(sessionStorage.getItem(reloadKey)).toBe('1');
  });
});
