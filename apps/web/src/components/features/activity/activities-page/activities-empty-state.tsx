import { AlertTriangle, RotateCcw, SearchX, Trash2, Users } from 'lucide-react';

interface ActivitiesEmptyStateProps {
  onClearAll: () => void;
  /** Shown when the age filter is likely what emptied the list. */
  onClearAge?: () => void;
}

export function ActivitiesEmptyState({
  onClearAll,
  onClearAge,
}: ActivitiesEmptyStateProps) {
  return (
    <div
      role="status"
      className="mx-auto mt-6 max-w-xl rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-6 py-12 text-center"
    >
      <SearchX
        aria-hidden
        className="mx-auto mb-4 h-10 w-10 text-neutral-400"
      />
      <h3 className="mb-2 text-base font-semibold text-neutral-800">
        Sonuç bulunamadı
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-sm text-neutral-500">
        Seçtiğiniz kriterlere uygun aktivite yok.
        {onClearAge
          ? ' Katılımcı yaşlarına uyan aktivite bulunamadı; yaş filtresini kaldırmayı deneyin.'
          : ' Filtreleri değiştirmeyi veya temizlemeyi deneyin.'}
      </p>
      <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          Filtreleri Temizle
        </button>
        {onClearAge && (
          <button
            type="button"
            onClick={onClearAge}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Users aria-hidden className="h-4 w-4" />
            Yaş filtresini kaldır
          </button>
        )}
      </div>
    </div>
  );
}

export function ActivitiesErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center"
    >
      <AlertTriangle
        aria-hidden
        className="mx-auto mb-4 h-10 w-10 text-rose-500"
      />
      <h3 className="mb-2 text-base font-semibold text-neutral-800">
        Aktiviteler yüklenemedi
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-sm text-neutral-600">
        Bağlantıda geçici bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        <RotateCcw aria-hidden className="h-4 w-4" />
        Tekrar dene
      </button>
    </div>
  );
}
