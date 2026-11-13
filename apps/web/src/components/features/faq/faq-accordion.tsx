import { ChevronDown } from 'lucide-react';

import type { FaqItem } from './faq-data';

type FaqAccordionProps = {
  items: FaqItem[];
  /** Allow multiple panels open (native details default). */
  className?: string;
};

function slugifyQuestion(question: string, index: number): string {
  const base = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `faq-${base || index}`;
}

/** Accessible accordion — <details>/<summary> + animated height, no client JS. */
export function FaqAccordion({ items, className }: FaqAccordionProps) {
  return (
    <div className={className ?? 'space-y-3'}>
      {items.map((item, index) => {
        const panelId = slugifyQuestion(item.question, index);
        return (
          <details
            key={panelId}
            className="group overflow-hidden rounded-lg border border-neutral-200/80 bg-white open:shadow-sm"
          >
            <summary
              className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset [&::-webkit-details-marker]:hidden"
              aria-controls={panelId}
            >
              <span className="min-w-0 text-left text-base leading-snug">
                {item.question}
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 ease-out group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div
              id={panelId}
              className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]"
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-neutral-200/60 px-5 pt-3 pb-5">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
