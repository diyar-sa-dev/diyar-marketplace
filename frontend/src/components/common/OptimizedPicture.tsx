import type { ImgHTMLAttributes } from 'react';
import { webpSrc } from '../../lib/media/pictureSources.ts';

type OptimizedPictureProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

/** Serves a WebP `<source>` when a sibling `.webp` exists; keeps original as fallback. */
export function OptimizedPicture({ src, alt = '', ...imgProps }: OptimizedPictureProps) {
  const webp = webpSrc(src);

  if (!webp) {
    return <img src={src} alt={alt} {...imgProps} />;
  }

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img src={src} alt={alt} {...imgProps} />
    </picture>
  );
}
