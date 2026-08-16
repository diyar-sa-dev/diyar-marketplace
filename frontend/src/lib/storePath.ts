export function isValidStoreSlug(slug: string | null | undefined): slug is string {
  if (slug == null) {
    return false;
  }
  const trimmed = slug.trim();
  return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
}

export function storePath(slug: string | null | undefined): string | null {
  return isValidStoreSlug(slug) ? `/store/${slug}` : null;
}
