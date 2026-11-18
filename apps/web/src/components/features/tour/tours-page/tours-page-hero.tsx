'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AiSearchPanel } from '@/components/features/ai-search/ai-search-panel';
import { listRoutes } from '@/services/route';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80';

type MarketplaceStats = {
  routeCount: number | null;
  operatorCount: number | null;
  avgRating: number | null;
};

function formatStat(value: number | null, loading: boolean): string {
  if (loading || value === null) return '—';
  return String(value);
}

function formatRating(value: number | null, loading: boolean): string {
  if (loading || value === null) return '—';
  return `${value.toFixed(1)}/5`;
}

/** Tours listing hero — intent-first copy + embedded Turta AI search. */
export function ToursPageHero() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats>({
    routeCount: null,
    operatorCount: null,
    avgRating: null,
  });

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    void listRoutes()
      .then((body) => {
        if (cancelled) return;
        const next = body.stats;
        setStats({
          routeCount: next?.routeCount ?? null,
          operatorCount: next?.operatorCount ?? null,
          avgRating: next?.avgRating ?? null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStats({
          routeCount: null,
          operatorCount: null,
          avgRating: null,
        });
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      data-testid="tours-page-hero"
      className="relative overflow-hidden border-b border-sky-900/10 bg-slate-900 pt-28 pb-12 md:pb-16"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-sky-950/75 via-teal-900/55 to-slate-900/70"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-sky-950/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-20%] left-[-5%] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
      />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 xl:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-sm backdrop-blur-md">
            <span className="mr-2 h-2 w-2 rounded-full bg-teal-300" />
            Turta&apos;ya sor
          </div>
          <h1 className="mb-3 text-3xl leading-tight font-bold tracking-tight text-white md:text-5xl">
            Nasıl bir tur <span className="text-teal-200">istiyorsun?</span>
          </h1>
          <p className="mb-8 text-base text-sky-50/85 md:px-6 md:text-lg">
            Kalkış şehri, gece sayısı veya tempo tercihini kendi cümlenle yaz.
            Sakin kaçış mı, parti temposu mu — uygun turları birlikte süzelim.
          </p>

          <div data-ai-search-hero className="mx-auto flex justify-center">
            <AiSearchPanel variant="hero" />
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 md:mt-12 md:grid-cols-4 md:gap-4">
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center shadow-lg shadow-slate-950/20 backdrop-blur-md">
            <div
              className={`mb-1 text-2xl font-bold text-white md:text-3xl ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatStat(stats.routeCount, statsLoading)}
            </div>
            <div className="text-sm text-sky-100/80">Yayındaki rota</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center shadow-lg shadow-slate-950/20 backdrop-blur-md">
            <div
              className={`mb-1 text-2xl font-bold text-white md:text-3xl ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatStat(stats.operatorCount, statsLoading)}
            </div>
            <div className="text-sm text-sky-100/80">Doğrulanmış acente</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center shadow-lg shadow-slate-950/20 backdrop-blur-md">
            <div
              className={`mb-1 text-2xl font-bold text-white md:text-3xl ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatRating(stats.avgRating, statsLoading)}
            </div>
            <div className="text-sm text-sky-100/80">Ortalama puan</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center shadow-lg shadow-slate-950/20 backdrop-blur-md">
            <div className="mb-1 text-2xl font-bold text-white md:text-3xl">
              4
            </div>
            <div className="text-sm text-sky-100/80">Tur kıyas limiti</div>
          </div>
        </div>
      </div>
    </div>
  );
}
