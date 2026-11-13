import Link from 'next/link';
import {
  HelpCircle as QuestionMarkCircleIcon,
  Mail as EnvelopeIcon,
} from 'lucide-react';

import { FaqAccordion } from './faq-accordion';
import { PLATFORM_FAQ_ITEMS, type FaqItem } from './faq-data';

type FaqSectionProps = {
  items?: FaqItem[];
  /** İletişim CTA hedefi — `/contact` veya `#contactForm` */
  contactHref?: string;
  /** Page-level variant: more top padding when used as /faq hero body */
  compact?: boolean;
};

export function FaqSection({
  items = PLATFORM_FAQ_ITEMS,
  contactHref = '/contact',
  compact = false,
}: FaqSectionProps) {
  const isHash = contactHref.startsWith('#');

  return (
    <section
      className={`bg-white ${compact ? 'py-12 md:py-16' : 'py-16 md:py-24'}`}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-prose text-center md:mb-16">
          <div className="mb-6 inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
            <QuestionMarkCircleIcon className="mr-1.5 h-4 w-4" aria-hidden />
            Sıkça Sorulan Sorular
          </div>
          <h2
            id="faq-heading"
            className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl"
          >
            Aklınızdaki Soruların Yanıtları
          </h2>
          <p className="text-lg leading-relaxed text-neutral-600">
            Seyahat ve rezervasyon süreçlerinizle ilgili en çok sorulan
            soruların yanıtlarını burada bulabilirsiniz.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={items} />

          <div className="mt-12 border-t border-neutral-200 pt-8 text-center">
            <p className="mb-5 text-sm text-neutral-600">
              Aradığınız sorunun cevabını bulamadınız mı?
            </p>
            {isHash ? (
              <a
                href={contactHref}
                className="inline-flex min-h-11 items-center rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-950 shadow-sm transition-colors hover:bg-neutral-100"
              >
                <EnvelopeIcon className="mr-2 h-4 w-4" aria-hidden />
                Bize Sorun
              </a>
            ) : (
              <Link
                href={contactHref}
                className="inline-flex min-h-11 items-center rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-950 shadow-sm transition-colors hover:bg-neutral-100"
              >
                <EnvelopeIcon className="mr-2 h-4 w-4" aria-hidden />
                Bize Sorun
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
