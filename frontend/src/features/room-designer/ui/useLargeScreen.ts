import { useEffect, useState } from 'react';
import { ROOM_DESIGNER_LG_BREAKPOINT_PX } from './constants.ts';

export function useLargeScreen(): boolean {
  const [large, setLarge] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${ROOM_DESIGNER_LG_BREAKPOINT_PX}px)`).matches
      : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${ROOM_DESIGNER_LG_BREAKPOINT_PX}px)`);
    const onChange = () => setLarge(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return large;
}
