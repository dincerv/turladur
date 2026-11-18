'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

import {
  filterHelpFaqs,
  HELP_FAQ_CATEGORIES,
  HELP_FAQS,
  type HelpFaqCategory,
} from './faq-data';

export function HelpFaqSection() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<HelpFaqCategory>('ALL');

  const filtered = useMemo(
    () => filterHelpFaqs(HELP_FAQS, { q, category }),
    [q, category],
  );

  return (
    <section className="space-y-4" data-testid="help-faq-section">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Sıkça Sorulan Sorular
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Kategori ve metin araması anlık olarak client tarafında filtrelenir.
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SSS içinde ara…"
          className="pl-10"
          data-testid="help-faq-search"
        />
      </div>

      <div
        className="flex flex-wrap gap-2"
        data-testid="help-faq-categories"
        role="tablist"
        aria-label="SSS kategorileri"
      >
        {HELP_FAQ_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`help-faq-cat-${cat.id}`}
              onClick={() => setCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p
          className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500"
          data-testid="help-faq-empty"
        >
          Aramanızla eşleşen SSS bulunamadı.
        </p>
      ) : (
        <Accordion
          type="single"
          collapsible
          defaultValue={filtered[0]?.id}
          className="rounded-xl border border-gray-100 bg-white px-4 shadow-sm"
          data-testid="help-faq-accordion"
        >
          {filtered.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              data-testid={`help-faq-item-${item.id}`}
            >
              <AccordionTrigger data-testid={`help-faq-trigger-${item.id}`}>
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="leading-relaxed text-gray-600">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
}
