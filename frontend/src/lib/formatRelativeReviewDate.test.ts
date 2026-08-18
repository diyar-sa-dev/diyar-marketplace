import { describe, expect, it } from 'vitest';
import { formatRelativeReviewDate } from './formatRelativeReviewDate.ts';

describe('formatRelativeReviewDate', () => {
  it('returns empty string for missing date', () => {
    expect(formatRelativeReviewDate(null, 'en')).toBe('');
  });

  it('formats recent dates in English', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeReviewDate(twoDaysAgo, 'en');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats recent dates in Arabic locale', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeReviewDate(twoDaysAgo, 'ar');
    expect(result.length).toBeGreaterThan(0);
  });
});
