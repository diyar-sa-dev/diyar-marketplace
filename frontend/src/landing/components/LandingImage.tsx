import { useState } from 'react';

type LandingImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  wrapperClassName?: string;
  objectFit?: 'cover' | 'contain';
};

export function LandingImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  wrapperClassName = '',
  objectFit = 'cover',
}: LandingImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {!loaded ? (
        <div
          className="absolute inset-0 landing-skeleton"
          aria-hidden
        />
      ) : null}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full transition-opacity duration-500 ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
}

export function LandingSectionSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24" aria-hidden>
      <div className="landing-skeleton mb-6 h-8 w-48 max-w-full rounded-xl" />
      <div className="landing-skeleton mb-3 h-4 w-full max-w-2xl rounded-lg" />
      <div className="landing-skeleton mb-10 h-4 w-5/6 max-w-xl rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="landing-skeleton h-28 rounded-2xl" />
        <div className="landing-skeleton h-28 rounded-2xl" />
        <div className="landing-skeleton h-28 rounded-2xl" />
        <div className="landing-skeleton h-28 rounded-2xl" />
      </div>
    </div>
  );
}
