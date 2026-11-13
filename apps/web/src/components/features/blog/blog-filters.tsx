import { Search } from 'lucide-react';

import { BLOG_CATEGORY_OPTIONS } from './blog.helpers';

type BlogFiltersProps = {
  query: string;
  categorySlug?: string;
};

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/20';

export function BlogFilters({ query, categorySlug }: BlogFiltersProps) {
  return (
    <form
      action="/blog"
      method="get"
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      aria-label="Blog ara"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="blog-q"
          className="mb-1.5 block text-xs font-medium text-neutral-600"
        >
          Ara
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            id="blog-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Kapadokya, Balkanlar, gastronomi…"
            autoComplete="off"
            maxLength={120}
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      <div className="sm:w-52">
        <label
          htmlFor="blog-category"
          className="mb-1.5 block text-xs font-medium text-neutral-600"
        >
          Kategori
        </label>
        <select
          id="blog-category"
          name="category"
          defaultValue={categorySlug ?? ''}
          className={INPUT_CLASS}
        >
          <option value="">Tüm kategoriler</option>
          {BLOG_CATEGORY_OPTIONS.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      >
        Ara
      </button>
    </form>
  );
}
