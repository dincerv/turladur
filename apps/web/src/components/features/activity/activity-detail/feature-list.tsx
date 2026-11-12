'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeatureListVariant = 'included' | 'excluded' | 'highlight';

const VARIANTS: Record<
  FeatureListVariant,
  { icon: LucideIcon; iconClass: string; srPrefix: string }
> = {
  included: {
    icon: Check,
    iconClass: 'bg-emerald-50 text-emerald-600',
    srPrefix: 'Dâhil: ',
  },
  excluded: {
    icon: X,
    iconClass: 'bg-rose-50 text-rose-600',
    srPrefix: 'Dâhil değil: ',
  },
  highlight: {
    icon: Sparkles,
    iconClass: 'bg-sky-50 text-sky-600',
    srPrefix: '',
  },
};

interface FeatureListProps {
  items: readonly string[];
  variant: FeatureListVariant;
  /** Mobile shows this many items before "Tümünü gör"; desktop shows all. */
  collapseAfter?: number;
  columns?: 1 | 2;
  className?: string;
}

/** Icon list for highlights / included / excluded. Renders nothing when empty. */
export function FeatureList({
  items,
  variant,
  collapseAfter = 5,
  columns = 1,
  className,
}: FeatureListProps) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  const { icon: Icon, iconClass, srPrefix } = VARIANTS[variant];
  const hiddenCount = Math.max(0, items.length - collapseAfter);

  return (
    <div className={cn('min-w-0', className)}>
      <ul
        id={listId}
        className={cn(
          'grid gap-x-6 gap-y-3',
          columns === 2 && 'sm:grid-cols-2',
        )}
      >
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className={cn(
              'flex min-w-0 items-start gap-3',
              !expanded && index >= collapseAfter && 'hidden md:flex',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                iconClass,
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 break-words text-[15px] leading-6 text-neutral-700 [overflow-wrap:anywhere]">
              {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
              {item}
            </span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 md:hidden"
        >
          {expanded ? 'Daralt' : `Tümünü gör (+${hiddenCount})`}
          <ChevronDown
            aria-hidden
            className={cn(
              'h-4 w-4 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
