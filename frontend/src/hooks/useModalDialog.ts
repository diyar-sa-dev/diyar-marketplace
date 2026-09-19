import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
  );
}

/**
 * Minimal modal dialog behavior aligned with existing overlay modals:
 * initial focus, Tab cycle, Escape to close, restore focus on exit.
 */
export function useModalDialog(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = getFocusableElements(container);
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [containerRef, onClose, open]);
}
