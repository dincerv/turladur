import Link from 'next/link';

import { MailtoLink } from '@/components/ui/mailto-link';
import type { CompanyEmailKey } from '@/lib/company';

export type LegalTocItem = {
  id: string;
  label: string;
};

type LegalPageShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  updatedAt?: string;
  toc?: LegalTocItem[];
  contactEmailKey?: CompanyEmailKey;
};

/** Static legal/marketing shell — prose reading width + optional sticky TOC. */
export function LegalPageShell({
  title,
  description,
  children,
  updatedAt = '13 Kasım 2026',
  toc = [],
  contactEmailKey = 'info',
}: LegalPageShellProps) {
  const hasToc = toc.length > 0;

  return (
    <div className="bg-white">
      <header className="border-b border-neutral-200 bg-neutral-50 pt-24 pb-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className={hasToc ? 'max-w-3xl' : 'mx-auto max-w-prose'}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              turta
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-balance text-neutral-900 md:text-4xl">
              {title}
            </h1>
            <p className="text-base leading-relaxed text-neutral-600 md:text-lg">
              {description}
            </p>
            <p className="mt-4 text-xs text-neutral-400">
              Son güncelleme: {updatedAt}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <div
          className={
            hasToc
              ? 'lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-12'
              : ''
          }
        >
          {hasToc ? (
            <nav
              aria-label="İçindekiler"
              className="mb-10 lg:mb-0 lg:sticky lg:top-28"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                İçindekiler
              </p>
              <ol className="space-y-1 border-l border-neutral-200 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-950"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div>
            <article className="prose prose-neutral prose-lg max-w-prose prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-neutral-900 prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-xl prose-p:leading-relaxed prose-p:text-neutral-700 prose-li:leading-relaxed prose-li:text-neutral-700 prose-a:font-medium prose-a:text-neutral-950 prose-a:underline-offset-2">
              {children}
            </article>

            <div className="mt-12 max-w-prose border-t border-neutral-200 pt-8 text-sm text-neutral-500">
              Sorularınız için{' '}
              <Link
                href="/contact"
                className="font-medium text-neutral-950 underline-offset-2 hover:underline"
              >
                iletişime geçin
              </Link>
              {' · '}
              <MailtoLink
                emailKey={contactEmailKey}
                className="font-medium text-neutral-950 underline-offset-2 hover:underline"
              />
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
