import { describe, expect, it, vi } from 'vitest';

vi.mock('./env.ts', () => ({
  env: {
    backendUrl: '',
  },
}));

import { resolveMediaUrl } from './media.ts';

describe('resolveMediaUrl', () => {
  it('returns relative storage paths unchanged for same-origin proxy', () => {
    expect(resolveMediaUrl('/storage/media/providers/1/avatar/a.png')).toBe(
      '/storage/media/providers/1/avatar/a.png',
    );
  });

  it('rewrites absolute APP_URL storage links to same-origin paths', () => {
    expect(
      resolveMediaUrl('http://192.168.1.3:8080/storage/media/providers/1/avatar/a.png'),
    ).toBe('/storage/media/providers/1/avatar/a.png');
  });

  it('normalizes bare media disk paths', () => {
    expect(resolveMediaUrl('providers/1/avatar/a.png')).toBe(
      '/storage/media/providers/1/avatar/a.png',
    );
  });

  it('passes through external CDN URLs', () => {
    const external = 'https://images.unsplash.com/photo-123?w=200';
    expect(resolveMediaUrl(external)).toBe(external);
  });
});
