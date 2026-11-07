'use client';

import { LayoutGrid, List } from 'lucide-react';
import { ModernTourCard } from './modern-tour-card';
import { ToursLoadingSkeleton } from './tours-loading-skeleton';
import { ToursNoResults } from './tours-no-results';
import { useToursPageUi } from './tours-page-context';
import { isToursSortBy } from './tours-page.helpers';

export function ToursPageResults() {
  const {
    view,
    setView,
    sortBy,
    handleSortChange,
    isLoading,
    itemsPerPage,
    filteredTours,
    currentTours,
    totalItems,
    totalTours,
    currentPage,
    totalPages,
    resetFilters,
    handlePageChange,
    fetchError,
  } = useToursPageUi();

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-bold break-words text-neutral-900">
            Tüm Turlar
          </h1>
          <div className="h-1 w-16 bg-neutral-950" aria-hidden />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-label="Izgara görünümü"
            aria-pressed={view === 'grid'}
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${
              view === 'grid'
                ? 'bg-neutral-100 text-neutral-950'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="Liste görünümü"
            aria-pressed={view === 'list'}
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${
              view === 'list'
                ? 'bg-neutral-100 text-neutral-950'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <List className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="tours-sort">
          Sıralama
        </label>
        <select
          id="tours-sort"
          value={sortBy}
          onChange={(e) => {
            const next = e.target.value;
            if (isToursSortBy(next)) handleSortChange(next);
          }}
          className="min-h-11 max-w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none sm:max-w-xs"
        >
          <option value="popular">Popülerliğe Göre</option>
          <option value="price-low">Fiyat (Düşükten Yükseğe)</option>
          <option value="price-high">Fiyat (Yüksekten Düşüğe)</option>
          <option value="date">Tarihe Göre</option>
          <option value="rating">Puana Göre</option>
        </select>

        <p className="text-sm text-neutral-600">
          {totalTours > 0 ? (
            <>
              Toplam{' '}
              <span className="font-semibold text-neutral-800">
                {totalTours}
              </span>{' '}
              tur bulundu
            </>
          ) : (
            <span className="text-neutral-500">
              Gösterilecek tur bulunamadı
            </span>
          )}
        </p>
      </div>

      {fetchError ? (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm break-words text-amber-900"
          role="alert"
        >
          {fetchError}
        </div>
      ) : null}

      {isLoading ? (
        <ToursLoadingSkeleton itemsPerPage={itemsPerPage} />
      ) : filteredTours.length === 0 ? (
        <ToursNoResults onReset={resetFilters} />
      ) : (
        <>
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3'
                : 'grid grid-cols-1 gap-4'
            }
          >
            {currentTours.map((tour, index) => (
              <ModernTourCard
                key={tour.id}
                tour={tour}
                layout={view}
                priority={index < 3}
              />
            ))}
          </div>

          {totalItems > itemsPerPage ? (
            <nav
              className="mt-8 flex flex-wrap justify-center gap-2"
              aria-label="Sayfalama"
            >
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="min-h-11 rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:opacity-50"
              >
                Önceki
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev != null && page - prev > 1;
                  return (
                    <span key={page} className="contents">
                      {showEllipsis ? (
                        <span className="flex min-h-11 items-center px-1 text-neutral-400">
                          …
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                          currentPage === page
                            ? 'bg-neutral-950 text-white'
                            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="min-h-11 rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:opacity-50"
              >
                Sonraki
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
