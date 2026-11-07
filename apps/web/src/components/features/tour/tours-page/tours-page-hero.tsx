'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listRoutes } from '@/services/route';
import { useToursPageUi } from './tours-page-context';
import { sanitizeSearchQuery } from './tours-page.helpers';

const TOURS_RESULTS_ANCHOR_ID = 'tours-results';

type MarketplaceStats = {
  routeCount: number | null;
  operatorCount: number | null;
  avgRating: number | null;
};

function scrollToToursResults() {
  document.getElementById(TOURS_RESULTS_ANCHOR_ID)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function formatStat(value: number | null, loading: boolean): string {
  if (loading || value === null) return '—';
  return String(value);
}

function formatRating(value: number | null, loading: boolean): string {
  if (loading || value === null) return '—';
  return `${value.toFixed(1)}/5`;
}

/** Split from tours-page-client.tsx (Faz 7) — hero; stats from Nest catalog routes. */
export function ToursPageHero() {
  const { searchTerm, setSearchTerm, setLoading } = useToursPageUi();
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

  function handleSearch() {
    setLoading(true);
    scrollToToursResults();
    setTimeout(() => setLoading(false), 500);
  }

  return (
    <div className="relative bg-gradient-to-r from-neutral-900 to-neutral-950 pt-28 pb-12 md:pb-20">
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-20 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center bg-neutral-950/30 backdrop-blur-sm text-neutral-200 rounded-full py-1.5 px-4 text-xs font-medium mb-4">
            <span className="w-2 h-2 bg-neutral-300 rounded-full mr-2"></span>
            En İyi Tur Deneyimleri
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Türkiye&apos;nin <span className="text-white/90">En İyi</span>{' '}
            Turları
          </h1>
          <p className="text-lg text-neutral-200 md:px-8 mb-8">
            Profesyonel rehberler eşliğinde, en iyi tur operatörlerinin özenle
            hazırladığı tur paketleri ile unutulmaz deneyimler yaşayın.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-neutral-600 blur-xl opacity-20 rounded-xl"></div>
            <div className="relative flex bg-white rounded-xl p-1.5 shadow-xl">
              <div className="flex-1 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="search"
                  name="q"
                  maxLength={120}
                  autoComplete="off"
                  placeholder="Tur adı, destinasyon veya aktivite ara..."
                  className="w-full truncate bg-transparent px-2 py-3 text-neutral-700 outline-none"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(sanitizeSearchQuery(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="flex min-h-11 items-center rounded-lg bg-neutral-950 px-5 py-3 font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Ara
              </button>
            </div>
          </div>
        </div>

        {/* İstatistikler — Nest GET /catalog/routes stats (aynı kaynak: /routes) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div
              className={`text-3xl font-bold text-white mb-1 ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatStat(stats.routeCount, statsLoading)}
            </div>
            <div className="text-sm text-neutral-200">Tur Rotası</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div
              className={`text-3xl font-bold text-white mb-1 ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatStat(stats.operatorCount, statsLoading)}
            </div>
            <div className="text-sm text-neutral-200">Tur Operatörü</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div
              className={`text-3xl font-bold text-white mb-1 ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {formatRating(stats.avgRating, statsLoading)}
            </div>
            <div className="text-sm text-neutral-200">Müşteri Puanı</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">24/7</div>
            <div className="text-sm text-neutral-200">Müşteri Desteği</div>
          </div>
        </div>
      </div>
    </div>
  );
}
