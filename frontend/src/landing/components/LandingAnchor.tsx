import type { ReactNode } from 'react';
import { handleLandingAnchorClick } from '../landingScroll.ts';

type LandingAnchorProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  onNavigate?: () => void;
};

export function LandingAnchor({ href, className, children, ariaLabel, onNavigate }: LandingAnchorProps) {
  if (!href.startsWith('#')) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => handleLandingAnchorClick(event, href, onNavigate)}
    >
      {children}
    </a>
  );
}
