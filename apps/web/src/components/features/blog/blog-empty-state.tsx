import Link from 'next/link';
import { FileText, SearchX } from 'lucide-react';

import { categoryLabel, toSafeSearchLabel } from './blog.helpers';

type BlogEmptyStateProps = {
  query: string;
  categorySlug?: string;
};

export function BlogEmptyState({ query, categorySlug }: BlogEmptyStateProps) {
  const safeQuery = toSafeSearchLabel(query);
  const categoryName = categoryLabel(categorySlug);
  const hasFilters = Boolean(safeQuery || categorySlug);

  return (
    <div
      role="status"
      className="mx-auto mt-10 max-w-lg rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-6 py-12 text-center"
    >
      {hasFilters ? (
        <SearchX
          className="mx-auto mb-4 h-10 w-10 text-neutral-400"
          aria-hidden
        />
      ) : (
        <FileText
          className="mx-auto mb-4 h-10 w-10 text-neutral-400"
          aria-hidden
        />
      )}

      <h2 className="mb-2 text-base font-semibold text-neutral-900">
        {hasFilters ? 'Sonuç bulunamadı' : 'Henüz yazı yok'}
      </h2>

      <p className="mx-auto mb-6 max-w-sm break-words text-sm leading-relaxed text-neutral-500">
        {safeQuery && categoryName ? (
          <>
            “{safeQuery}” araması ve{' '}
            <span className="font-medium text-neutral-700">{categoryName}</span>{' '}
            kategorisi için yazı bulunamadı.
          </>
        ) : safeQuery ? (
          <>
            “{safeQuery}” araması için yazı bulunamadı. Farklı bir kelime
            deneyin veya filtreleri temizleyin.
          </>
        ) : categoryName ? (
          <>
            <span className="font-medium text-neutral-700">{categoryName}</span>{' '}
            kategorisinde henüz yayınlanmış yazı yok.
          </>
        ) : (
          <>Yakında yeni rota rehberleri ve seyahat yazıları eklenecek.</>
        )}
      </p>

      <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
        {hasFilters ? (
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            Aramayı temizle
          </Link>
        ) : null}
        <Link
          href={hasFilters ? '/tours' : '/routes'}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${
            hasFilters
              ? 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
              : 'bg-neutral-950 text-white hover:bg-neutral-800'
          }`}
        >
          {hasFilters ? 'Turları keşfet' : 'Rotaları incele'}
        </Link>
      </div>
    </div>
  );
}

export function BlogErrorState({ message }: { message?: string }) {
  return (
    <div
      role="alert"
      className="mx-auto mt-10 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <h2 className="mb-2 text-base font-semibold text-red-900">
        Yazılar yüklenemedi
      </h2>
      <p className="mx-auto mb-6 max-w-sm text-sm text-red-800">
        {message
          ? toSafeSearchLabel(message, 160)
          : 'Geçici bir bağlantı sorunu oluştu. Lütfen biraz sonra tekrar deneyin.'}
      </p>
      <Link
        href="/blog"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
      >
        Tekrar dene
      </Link>
    </div>
  );
}
