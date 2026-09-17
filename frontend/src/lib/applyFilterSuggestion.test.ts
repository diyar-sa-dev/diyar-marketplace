import { describe, expect, it } from 'vitest';
import { applyFilterSuggestion } from './applyFilterSuggestion.ts';

describe('applyFilterSuggestion', () => {
  it('sets discrete filter params for narrow suggestions', () => {
    const base = new URLSearchParams('type=products&category_slug=bedroom');
    const next = applyFilterSuggestion(base, {
      mode: 'set',
      set: { colors: 'White', discounted: true },
    });

    expect(next.get('colors')).toBe('White');
    expect(next.get('discounted')).toBe('1');
    expect(next.get('category_slug')).toBe('bedroom');
    expect(next.has('page')).toBe(false);
  });

  it('removes params for relax suggestions', () => {
    const base = new URLSearchParams('type=products&discounted=1&min_price=500');
    const next = applyFilterSuggestion(base, {
      mode: 'remove',
      remove: ['discounted', 'min_price'],
    });

    expect(next.has('discounted')).toBe(false);
    expect(next.has('min_price')).toBe(false);
    expect(next.get('type')).toBe('products');
  });
});
