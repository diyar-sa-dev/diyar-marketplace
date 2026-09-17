import { COMING_SOON_COPY } from './copy.ts';

export function ComingSoonMessage() {
  return (
    <div className="coming-soon-copy text-center md:text-start">
      <p className="coming-soon-enter coming-soon-enter-2 coming-soon-eyebrow">
        {COMING_SOON_COPY.eyebrow}
      </p>

      <h1 className="coming-soon-enter coming-soon-enter-4 coming-soon-headline">
        {COMING_SOON_COPY.headline}
      </h1>

      <p className="coming-soon-enter coming-soon-enter-5 coming-soon-supporting">
        {COMING_SOON_COPY.supporting}
      </p>

      <p className="coming-soon-enter coming-soon-enter-6 coming-soon-brand-line">
        {COMING_SOON_COPY.brandLine}
      </p>

      <div className="coming-soon-enter coming-soon-enter-7 coming-soon-divider" aria-hidden>
        <span className="coming-soon-divider-line" />
        <span className="coming-soon-divider-label">{COMING_SOON_COPY.waitLabel}</span>
        <span className="coming-soon-divider-line" />
      </div>
    </div>
  );
}
