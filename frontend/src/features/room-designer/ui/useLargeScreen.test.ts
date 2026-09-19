import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROOM_DESIGNER_LG_BREAKPOINT_PX } from './constants.ts';
import { useLargeScreen } from './useLargeScreen.ts';

describe('useLargeScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks matchMedia at lg breakpoint', () => {
    let listener: (() => void) | null = null;
    const mq = {
      matches: false,
      addEventListener: (_: string, fn: () => void) => {
        listener = fn;
      },
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mq as MediaQueryList);

    const { result } = renderHook(() => useLargeScreen());
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith(
      `(min-width: ${ROOM_DESIGNER_LG_BREAKPOINT_PX}px)`,
    );

    act(() => {
      mq.matches = true;
      listener?.();
    });
    expect(result.current).toBe(true);
  });
});
