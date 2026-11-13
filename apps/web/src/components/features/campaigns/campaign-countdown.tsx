'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

type CampaignCountdownProps = {
  endsAt: string;
  /** Server-computed remaining ms at render — avoids first-paint jump. */
  initialRemainingMs: number;
};

type Parts = { d: number; h: number; m: number; s: number };

function toParts(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Isolated countdown — only this leaf re-renders every second.
 * Ends when remaining hits 0 (does not trust client clock for listing).
 */
export function CampaignCountdown({
  endsAt,
  initialRemainingMs,
}: CampaignCountdownProps) {
  const endMs = Date.parse(endsAt);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, initialRemainingMs),
  );

  useEffect(() => {
    if (!Number.isFinite(endMs)) return;

    const tick = () => {
      setRemaining(Math.max(0, endMs - Date.now()));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Sona erdi
      </span>
    );
  }

  const { d, h, m, s } = toParts(remaining);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-neutral-600"
      aria-live="polite"
      aria-label={`Kalan süre: ${d} gün ${h} saat ${m} dakika`}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
      <span className="font-medium tabular-nums tracking-tight">
        {d > 0 ? `${d}g ` : null}
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </span>
  );
}
