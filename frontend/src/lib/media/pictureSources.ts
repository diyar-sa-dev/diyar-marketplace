const RASTER_EXT = /\.(jpe?g|png)$/i;

/** Same-path WebP sibling for local public assets. Remote URLs pass through unchanged. */
export function webpSrc(src: string): string | null {
  if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return null;
  }

  if (!RASTER_EXT.test(src)) {
    return null;
  }

  return src.replace(RASTER_EXT, '.webp');
}
