import { describe, expect, it } from 'vitest';
import { validateStoreReviewInput } from './storeReviewValidation.ts';

describe('validateStoreReviewInput', () => {
  it('requires a rating between 1 and 5', () => {
    expect(validateStoreReviewInput(0, '')).toBe('storeReviews.ratingRequired');
    expect(validateStoreReviewInput(6, '')).toBe('storeReviews.ratingRequired');
  });

  it('allows rating without comment', () => {
    expect(validateStoreReviewInput(5, '')).toBeNull();
  });

  it('rejects comments longer than 2000 characters', () => {
    expect(validateStoreReviewInput(4, 'a'.repeat(2001))).toBe('storeReviews.commentTooLong');
  });
});
