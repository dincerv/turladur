'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
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

function scoreTone(score: number): string {
  if (score >= 70) return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (score >= 45) return 'bg-amber-50 text-amber-900 ring-amber-200';
  return 'bg-rose-50 text-rose-800 ring-rose-200';
}

export function ReviewPersonaCard({
  tourId,
  initialPersona = 'CALM',
  initialIntent = '',
}: {
  tourId: string;
  initialPersona?: TravelerPersona;
  initialIntent?: string;
}) {
  const [persona, setPersona] = useState<TravelerPersona>(initialPersona);
  const [intent, setIntent] = useState(initialIntent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<TourPersonaMatchResponse | null>(null);

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

  useEffect(() => {
    void runMatch(persona, intent);
  }, [persona, runMatch]);

  return (
    <section
      data-testid="review-persona-card"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      aria-label="Sizin için uygunluk skoru"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            Sizin için uygunluk
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Yorumlar persona etiketleriyle ayrıştırılır; aynı özellik farklı
            gezginler için farklı puanlanabilir.
          </p>
        </div>
        {match ? (
          <div
            data-testid="persona-fit-score"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 ${scoreTone(match.fitScore)}`}
          >
            Skor {match.fitScore}/100
          </div>
        ) : null}
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
              onClick={() => setPersona(option.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
        />
        <button
          type="submit"
          data-testid="persona-match-submit"
          disabled={loading}
          className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Hesaplanıyor…' : 'Özeti güncelle'}
        </button>
      </form>

      {error ? (
        <p
          data-testid="persona-match-error"
          className="mt-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {match ? (
        <div data-testid="persona-match-result" className="mt-4 space-y-3">
          <p
            data-testid="persona-match-summary"
            className="text-sm leading-relaxed text-neutral-800"
          >
            {match.summary}
          </p>

          {(match.alignedTags.length > 0 || match.conflictTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {match.alignedTags.map((tag) => (
                <span
                  key={`aligned-${tag}`}
                  data-testid={`persona-tag-aligned-${tag}`}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
                >
                  {TAG_LABELS[tag] ?? `#${tag}`}
                </span>
              ))}
              {match.conflictTags.map((tag) => (
                <span
                  key={`conflict-${tag}`}
                  data-testid={`persona-tag-conflict-${tag}`}
                  className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800"
                >
                  {TAG_LABELS[tag] ?? `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {match.warnings.length > 0 ? (
            <ul
              data-testid="persona-warnings"
              className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-3 text-sm text-amber-950"
            >
              {match.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {match.highlights.length > 0 ? (
            <ul
              data-testid="persona-highlights"
              className="space-y-2 border-t border-neutral-100 pt-3"
            >
              {match.highlights.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  data-testid={`persona-highlight-${item.id}`}
                  data-alignment={item.alignment}
                  className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-800"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                    <span>
                      {item.rating}/5 · {item.alignment}
                    </span>
                    <span className="truncate">
                      {item.tags.map((tag) => TAG_LABELS[tag] ?? tag).join(' ')}
                    </span>
                  </div>
                  {item.comment ? (
                    <p className="mt-1 line-clamp-3 text-neutral-800">
                      {item.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
