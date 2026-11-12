'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toContentBlocks } from './activity-detail.helpers';

interface ContentRendererProps {
  /** Already plain text (see `toPlainText`); rendered via React text nodes only. */
  text: string;
  /** Mobile-only collapse threshold in characters. */
  collapseAfterChars?: number;
  emptyFallback?: string;
  className?: string;
}

/**
 * XSS-safe long-form renderer: paragraphs keep single line breaks, `- ` / `1.`
 * runs become lists. On mobile long text collapses behind "Devamını oku".
 */
export function ContentRenderer({
  text,
  collapseAfterChars = 600,
  emptyFallback,
  className,
}: ContentRendererProps) {
  const contentId = useId();
  const [expanded, setExpanded] = useState(false);
  const blocks = useMemo(() => toContentBlocks(text), [text]);
  const collapsible = text.length > collapseAfterChars || blocks.length > 4;
  const collapsed = collapsible && !expanded;

  if (blocks.length === 0) {
    return emptyFallback ? (
      <p className="text-sm text-neutral-500">{emptyFallback}</p>
    ) : null;
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div
        id={contentId}
        className={cn(
          'relative max-w-prose space-y-4 break-words text-[15px] leading-7 text-neutral-700 [overflow-wrap:anywhere]',
          collapsed &&
            'max-h-64 overflow-hidden md:max-h-none md:overflow-visible',
        )}
      >
        {blocks.map((block, i) =>
          block.kind === 'list' ? (
            <ul
              key={i}
              className="list-disc space-y-1.5 pl-5 marker:text-sky-600"
            >
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {block.text}
            </p>
          ),
        )}
        {collapsed ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent md:hidden"
          />
        ) : null}
      </div>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 md:hidden"
        >
          {expanded ? 'Daralt' : 'Devamını oku'}
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
