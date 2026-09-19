import { COMING_SOON_ASSETS, COMING_SOON_COPY } from './copy.ts';

export function BrandMark() {
  return (
    <div className="coming-soon-enter coming-soon-enter-1 flex justify-center md:justify-start">
      <img
        src={COMING_SOON_ASSETS.logo}
        alt={COMING_SOON_COPY.logoAlt}
        width={132}
        height={40}
        className="h-9 w-auto sm:h-10 md:h-11"
        decoding="async"
      />
    </div>
  );
}
