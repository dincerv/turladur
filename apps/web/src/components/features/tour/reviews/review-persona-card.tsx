'use client';

import { useCallback, useState } from 'react';
import type {
  PersonaAlignment,
  TourPersonaMatchResponse,
  TravelerPersona,
} from '@turta/shared-types';
import { matchTourPersona } from '@/services/review';

const PERSONA_OPTIONS: { id: TravelerPersona; label: string }[] = [
  { id: 'PARTY', label: 'Parti / eğlence' },
  { id: 'CALM', label: 'Sakin dinlenme' },
  { id: 'FAMILY', label: 'Çocuklu aile' },
  { id: 'BUDGET', label: 'Bütçe dostu' },
  { id: 'ADVENTURE', label: 'Macera' },
  { id: 'CULTURE', label: 'Kültür' },
];

const TAG_LABELS: Record<string, string> = {
  'gece-hayati': '#gece-hayati',
  'sakin-dinlenme': '#sakin-dinlenme',
  'cocuklu-aile': '#cocuklu-aile',
  'butce-dostu': '#butce-dostu',
  macera: '#macera',
  kultur: '#kultur',
};

const ALIGNMENT_LABELS: Record<
  PersonaAlignment,
  { label: string; className: string }
> = {
  positive: {
    label: 'Uyumlu',
    className: 'bg-emerald-100 text-emerald-800',
  },
  negative: {
    label: 'Çelişkili',
    className: 'bg-rose-100 text-rose-800',
  },
  neutral: {
    label: 'Genel',
    className: 'bg-neutral-200/80 text-neutral-700',
  },
};

function scoreTone(score: number): string {
  if (score >= 70) return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (score >= 45) return 'bg-amber-50 text-amber-900 ring-amber-200';
  return 'bg-rose-50 text-rose-800 ring-rose-200';
}

export function ReviewPersonaCard({
  tourId,
  initialPersona,
  initialIntent = '',
}: {
  tourId: string;
  /** Verilirse ilk yüklemede skor hesaplanır; aksi halde kullanıcı seçene kadar beklenir. */
  initialPersona?: TravelerPersona;
  initialIntent?: string;
}) {
  const [persona, setPersona] = useState<TravelerPersona | null>(
    initialPersona ?? null,
  );
  const [intent, setIntent] = useState(initialIntent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<TourPersonaMatchResponse | null>(null);
  const hasSelection = persona != null;

  const runMatch = useCallback(
    async (nextPersona: TravelerPersona, nextIntent: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await matchTourPersona(tourId, {
          persona: nextPersona,
          intent: nextIntent.trim() || undefined,
        });
        setMatch(data);
      } catch (err) {
        setMatch(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Kişiselleştirilmiş yorum özeti alınamadı',
        );
      } finally {
        setLoading(false);
      }
    },
    [tourId],
  );

  function selectPersona(next: TravelerPersona) {
    setPersona(next);
    void runMatch(next, intent);
  }

  return (
    <section
      data-testid="review-persona-card"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      aria-label="Sizin için uygunluk skoru"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
            Sizin için uygunluk
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-neutral-600">
            Tercihinize göre yorumlar uyumlu / çelişkili olarak ayrılır; skor
            yalnızca sizin seçiminizle ilişkili sinyallerden hesaplanır.
          </p>
        </div>
        {hasSelection && match ? (
          <div
            data-testid="persona-fit-score"
            className={`rounded-xl px-3.5 py-2 text-base font-semibold ring-1 ${scoreTone(match.fitScore)}`}
          >
            Skor {match.fitScore}/100
          </div>
        ) : (
          <div
            data-testid="persona-fit-placeholder"
            className="rounded-xl bg-neutral-50 px-3.5 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200"
          >
            Tercihinizi seçin
          </div>
        )}
      </div>

      <div
        data-testid="persona-selector"
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Seyahat personası"
      >
        {PERSONA_OPTIONS.map((option) => {
          const active = option.id === persona;
          return (
            <button
              key={option.id}
              type="button"
              data-testid={`persona-chip-${option.id}`}
              onClick={() => selectPersona(option.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!persona) {
            setError('Önce bir tercih seçin.');
            return;
          }
          void runMatch(persona, intent);
        }}
      >
        <label className="sr-only" htmlFor="persona-intent-input">
          Tercih metni
        </label>
        <input
          id="persona-intent-input"
          data-testid="persona-intent-input"
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          maxLength={300}
          placeholder='Örn. "Sakinlik istiyorum" veya "Parti/eğlence seviyorum"'
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-base text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
        />
        <button
          type="submit"
          data-testid="persona-match-submit"
          disabled={loading || !persona}
          className="rounded-xl bg-neutral-950 px-4 py-2.5 text-base font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Hesaplanıyor…' : 'Özeti güncelle'}
        </button>
      </form>

      {error ? (
        <p
          data-testid="persona-match-error"
          className="mt-3 text-base text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {hasSelection && match ? (
        <div data-testid="persona-match-result" className="mt-4 space-y-3">
          <p
            data-testid="persona-match-summary"
            className="text-base leading-relaxed text-neutral-800"
          >
            {match.summary}
          </p>

          {(match.alignedTags.length > 0 || match.conflictTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {match.alignedTags.map((tag) => (
                <span
                  key={`aligned-${tag}`}
                  data-testid={`persona-tag-aligned-${tag}`}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                >
                  {TAG_LABELS[tag] ?? `#${tag}`}
                </span>
              ))}
              {match.conflictTags.map((tag) => (
                <span
                  key={`conflict-${tag}`}
                  data-testid={`persona-tag-conflict-${tag}`}
                  className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                >
                  {TAG_LABELS[tag] ?? `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {match.warnings.length > 0 ? (
            <ul
              data-testid="persona-warnings"
              className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3 text-base text-amber-950"
            >
              {match.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {match.highlights.length > 0 ? (
            <ul
              data-testid="persona-highlights"
              className="space-y-2.5 border-t border-neutral-100 pt-3"
            >
              {match.highlights.slice(0, 4).map((item) => {
                const tone = ALIGNMENT_LABELS[item.alignment];
                return (
                  <li
                    key={item.id}
                    data-testid={`persona-highlight-${item.id}`}
                    data-alignment={item.alignment}
                    className="rounded-xl bg-neutral-50 px-3.5 py-2.5 text-base text-neutral-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums text-neutral-700">
                          {item.rating}/5
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone.className}`}
                        >
                          {tone.label}
                        </span>
                      </span>
                      {item.tags.length > 0 ? (
                        <span className="truncate text-xs">
                          {item.tags
                            .map((tag) => TAG_LABELS[tag] ?? tag)
                            .join(' ')}
                        </span>
                      ) : null}
                    </div>
                    {item.comment ? (
                      <p className="mt-1.5 line-clamp-3 leading-relaxed text-neutral-800">
                        {item.comment}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
