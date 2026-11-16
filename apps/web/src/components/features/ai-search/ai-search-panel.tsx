'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  GitCompareArrows,
  Loader2,
  SendHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import type { AiSearchResponse } from '@turta/shared-types';
import {
  AI_SEARCH_PROMPT_MAX,
  sanitizeAiSearchPrompt,
} from '@turta/shared-validators';
import { ApiError } from '@/services/api-client';
import { askTurtaAiSearch } from '@/services/ai-search';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { CompactCompareButton } from '@/components/features/tour/compare/compact-compare-button';
import {
  COMPARE_TOURS_MAX,
  useTourCompareStore,
} from '@/stores/tour-compare-store';
import {
  AI_SEARCH_QUICK_PROMPTS,
  type AiSearchQuickPrompt,
} from './ai-search.constants';

const PLACEHOLDER = 'https://placehold.co/160x100/e5e7eb/6b7280?text=Tur';
const DEBOUNCE_SUBMIT_MS = 350;

function formatPrice(price: string, currency: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₺${Math.round(n).toLocaleString('tr-TR')}`;
  }
}

export function AiSearchPanel({
  variant = 'dock',
}: {
  variant?: 'dock' | 'hero';
}) {
  const inputId = useId();
  const isHero = variant === 'hero';
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiSearchResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toggle = useTourCompareStore((state) => state.toggle);
  const openDrawer = useTourCompareStore((state) => state.openDrawer);
  const selectedCount = useTourCompareStore((state) => state.selected.length);
  const clearCompare = useTourCompareStore((state) => state.clear);

  const runSearch = useCallback(async (raw: string) => {
    const cleaned = sanitizeAiSearchPrompt(raw);
    if (cleaned.length < 3) {
      setError('Lütfen biraz daha detay yazın');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setOpen(true);

    try {
      const data = await askTurtaAiSearch(cleaned, controller.signal);
      if (!controller.signal.aborted) {
        setResult(data);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setResult(null);
      if (err instanceof ApiError && err.status === 429) {
        setError('Çok hızlı sordunuz. Birkaç saniye sonra tekrar deneyin.');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Arama şu an yanıt veremedi. Lütfen tekrar deneyin.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const scheduleSearch = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void runSearch(raw);
      }, DEBOUNCE_SUBMIT_MS);
    },
    [runSearch],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const applyQuickPrompt = (item: AiSearchQuickPrompt) => {
    setPrompt(item.prompt);
    setOpen(true);
    scheduleSearch(item.prompt);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    scheduleSearch(prompt);
  };

  const handleCompactCompareFromAi = () => {
    if (!result || result.tours.length === 0) return;
    if (selectedCount >= 2) {
      openDrawer();
      return;
    }
    clearCompare();
    for (const tour of result.tours.slice(0, 2)) {
      toggle({
        id: tour.id,
        title: tour.title,
        coverUrl: tour.coverUrl,
        priceLabel: formatPrice(tour.price, tour.currency),
      });
    }
    openDrawer();
  };

  const resultsBody = (
    <div
      className={
        isHero
          ? 'max-h-[min(56vh,480px)] space-y-3 overflow-y-auto px-4 py-3'
          : 'max-h-[min(52vh,420px)] space-y-3 overflow-y-auto px-4 py-3'
      }
    >
      {loading ? (
        <div
          data-testid="ai-search-loading"
          className="space-y-3"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div
          data-testid="ai-search-error"
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && result ? (
        <div data-testid="ai-search-result" className="space-y-3">
          <p className="text-sm leading-relaxed text-neutral-800">
            {result.reply}
          </p>

          {result.summaryPills.length > 0 ? (
            <div
              data-testid="ai-search-summary"
              className="flex flex-wrap gap-1.5"
              aria-label="Arama özeti"
            >
              {result.summaryPills.map((pill) => (
                <span
                  key={pill.id}
                  data-testid={`ai-search-pill-${pill.id}`}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {pill.label}
                </span>
              ))}
            </div>
          ) : null}

          {result.empty ? (
            <p
              data-testid="ai-search-empty"
              className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-600"
            >
              Sonuç bulunamadı. Farklı bir ifade deneyin.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {result.tours.map((tour) => {
                const src = resolveMediaUrl(tour.coverUrl) || PLACEHOLDER;
                return (
                  <li
                    key={tour.id}
                    data-testid={`ai-search-tour-${tour.id}`}
                    className="flex gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 p-2"
                  >
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="80px"
                        unoptimized={shouldUnoptimizeMedia(src)}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/tours/${tour.id}`}
                          className="line-clamp-2 text-xs font-semibold text-neutral-900 hover:underline"
                        >
                          {tour.title}
                        </Link>
                        {tour.personaBadge ? (
                          <span
                            data-testid={`ai-persona-badge-${tour.id}`}
                            data-tone={tour.personaBadge.tone}
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              tour.personaBadge.tone === 'aligned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tour.personaBadge.tone === 'conflict'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {tour.personaBadge.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {formatPrice(tour.price, tour.currency)} ·{' '}
                        {tour.durationDays} gün
                      </p>
                      <div className="mt-1">
                        <CompactCompareButton
                          tour={{
                            id: tour.id,
                            title: tour.title,
                            coverUrl: tour.coverUrl,
                            priceLabel: formatPrice(tour.price, tour.currency),
                          }}
                          testId={`ai-compare-select-${tour.id}`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {!loading && !error && !result ? (
        <p className="text-sm text-neutral-500">
          Örn. &quot;Ankara&apos;dan 3 gece Karadeniz, Uzungöl ve Ayder&quot;
        </p>
      ) : null}
    </div>
  );

  const formBlock = (
    <form
      data-testid="ai-search-dock"
      onSubmit={handleSubmit}
      className={
        isHero
          ? 'rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm'
          : 'rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-xl shadow-neutral-900/10 backdrop-blur-md'
      }
    >
      <div
        data-testid="ai-search-quick-prompts"
        className="mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {AI_SEARCH_QUICK_PROMPTS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`quick-prompt-chip-${item.id}`}
            onClick={() => applyQuickPrompt(item)}
            className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Turta&apos;ya yaz
        </label>
        <input
          ref={inputRef}
          id={inputId}
          data-testid="ai-search-input"
          type="text"
          value={prompt}
          maxLength={AI_SEARCH_PROMPT_MAX}
          placeholder={
            isHero
              ? "Örn. Ankara'dan 3 gece sakin Karadeniz turu"
              : "Turta'ya yaz..."
          }
          onChange={(event) => setPrompt(event.target.value)}
          onFocus={() => setOpen(true)}
          className="min-h-11 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-0"
        />
        <button
          type="submit"
          data-testid="ai-search-submit-btn"
          disabled={loading || prompt.trim().length < 3}
          aria-label="Ara"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizontal className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </form>
  );

  const resultsPanel = (
    <AnimatePresence>
      {open ? (
        <motion.section
          key="ai-search-panel"
          data-testid="ai-search-panel"
          initial={{ y: isHero ? -8 : 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isHero ? -8 : 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className={
            isHero
              ? 'mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm'
              : 'mb-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-2xl shadow-neutral-900/15 backdrop-blur-md'
          }
          aria-label="Turta'ya Sor"
        >
          <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                Turta&apos;ya Sor
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Doğal dille tur arayın, sonuçları kıyaslayın.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="compact-compare-btn"
                aria-label={`Kıyasla (${selectedCount}/${COMPARE_TOURS_MAX})`}
                disabled={
                  loading ||
                  !result ||
                  (result.tours.length < 2 && selectedCount < 1)
                }
                onClick={handleCompactCompareFromAi}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <GitCompareArrows className="h-4 w-4" aria-hidden />
                {selectedCount > 0 ? (
                  <span
                    data-testid="compact-compare-badge"
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white"
                  >
                    {selectedCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label="Paneli kapat"
                data-testid="ai-search-close-btn"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </header>
          {resultsBody}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div
      className={
        isHero
          ? 'pointer-events-auto w-full max-w-3xl'
          : 'pointer-events-auto w-full max-w-2xl'
      }
    >
      {isHero ? (
        <>
          {formBlock}
          {resultsPanel}
        </>
      ) : (
        <>
          {resultsPanel}
          {formBlock}
        </>
      )}
    </div>
  );
}
