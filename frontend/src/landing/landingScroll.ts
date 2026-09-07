import type { MouseEvent } from 'react';

export function landingScrollTo(hash: string, onComplete?: () => void) {
  const id = hash.replace(/^#/, '');
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });

  if (onComplete) {
    window.setTimeout(onComplete, prefersReducedMotion ? 0 : 450);
  }
}

export function handleLandingAnchorClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onComplete?: () => void,
) {
  if (!href.startsWith('#')) {
    return;
  }

  event.preventDefault();
  landingScrollTo(href, onComplete);
}
