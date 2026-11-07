import type { ReactNode } from 'react';

import { COMPANY, getCompanyAddressOneLine } from '@/lib/company';

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white pt-32 pb-20">
      <article className="container mx-auto max-w-3xl px-6">
        <h1 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">
          {title}
        </h1>
        {updated ? (
          <p className="mb-10 text-sm text-neutral-500">
            Son güncelleme: {updated}
          </p>
        ) : (
          <div className="mb-10" />
        )}
        <div className="space-y-4 text-sm leading-relaxed text-neutral-700 [&_a]:text-sky-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-12 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          {COMPANY.brand} · {getCompanyAddressOneLine()} ·{' '}
          <a href={`mailto:${COMPANY.emails.info}`}>{COMPANY.emails.info}</a>
        </p>
      </article>
    </div>
  );
}
