import { useCallback, useEffect, useState } from 'react';

const DEFAULT_SECONDS = 60;

export function useOtpCooldown(initialSeconds = DEFAULT_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const startCooldown = useCallback(
    (seconds = initialSeconds) => {
      setSecondsLeft(seconds);
    },
    [initialSeconds],
  );

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    startCooldown,
  };
}
