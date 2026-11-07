'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { sanitizePlainText } from './tour-detail.helpers';

type TourDetailExpandableTextProps = {
  text: string;
  lines?: 3 | 4 | 5 | 6;
  className?: string;
  emptyFallback?: string;
};

const LINE_CLAMP: Record<
  NonNullable<TourDetailExpandableTextProps['lines']>,
  string
> = {
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

/** Plain-text expandable block — XSS-safe (no HTML render). */
export function TourDetailExpandableText({
  text,
  lines = 4,
  className,
  emptyFallback = 'Açıklama bulunmuyor.',
}: TourDetailExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const clean = sanitizePlainText(text);
  const display = clean || emptyFallback;
  const needsToggle = clean.length > 180;

  return (
    <div className={cn('min-w-0', className)}>
      <p
        className={cn(
          'break-words text-sm leading-relaxed text-neutral-700 [overflow-wrap:anywhere]',
          !expanded && needsToggle && LINE_CLAMP[lines],
        )}
      >
        {display}
      </p>
      {needsToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-neutral-950 underline-offset-2 transition-colors hover:text-neutral-700 hover:underline active:scale-[0.98]"
        >
          {expanded ? 'Daha az göster' : 'Devamını oku'}
        </button>
      ) : null}
    </div>
  );
}
