'use client';

import { useEffect, useState } from 'react';
import { calculateTimeLeft, type TimeLeft } from './activities-page.helpers';

/**
 * Ticks only inside the consumer (not the whole page). Returns `null` until
 * mounted so server and client markup match.
 */
export function useCountdown(offsetMs: number): TimeLeft | null {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = Date.now() + offsetMs;
    const tick = () => {
      const next = calculateTimeLeft(target);
      setTimeLeft(next);
      return next.days + next.hours + next.minutes + next.seconds > 0;
    };
    if (!tick()) return;
    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [offsetMs]);

  return timeLeft;
}
