import { describe, expect, it } from 'vitest';
import { resolveSameOriginUrl } from './resolveSameOriginUrl.ts';

describe('resolveSameOriginUrl', () => {
  it('rewrites localhost backend URLs onto the current origin', () => {
    const resolved = resolveSameOriginUrl(
      'http://localhost:3000/orders?highlight=abc&payment=paid',
    );

    expect(resolved.origin).toBe(window.location.origin);
    expect(resolved.pathname).toBe('/orders');
    expect(resolved.searchParams.get('highlight')).toBe('abc');
    expect(resolved.searchParams.get('payment')).toBe('paid');
  });
});
