const MAX_COMMENT_LENGTH = 2000;

export function validateStoreReviewInput(
  rating: number,
  comment: string,
): 'storeReviews.ratingRequired' | 'storeReviews.commentTooLong' | null {
  if (rating < 1 || rating > 5) {
    return 'storeReviews.ratingRequired';
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return 'storeReviews.commentTooLong';
  }

  return null;
}

export { MAX_COMMENT_LENGTH };
