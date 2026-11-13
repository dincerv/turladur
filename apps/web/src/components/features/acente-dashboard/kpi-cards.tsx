import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type { DashboardKpiCard } from './types';

type KpiCardsProps = {
  cards: DashboardKpiCard[];
};

export function KpiCards({ cards }: KpiCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className="flex h-full min-h-[8.5rem] flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {card.title}
              </p>
              <span className="rounded-lg bg-neutral-100 p-2 text-neutral-800">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 tabular-nums">
              {card.value}
            </p>
            {card.trend ? (
              <p
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                  card.trend.direction === 'up'
                    ? 'text-emerald-600'
                    : card.trend.direction === 'down'
                      ? 'text-red-500'
                      : 'text-neutral-500'
                }`}
              >
                {card.trend.direction === 'up' ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                ) : card.trend.direction === 'down' ? (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                )}
                {card.trend.label}
              </p>
            ) : card.hint ? (
              <p className="mt-2 text-xs text-neutral-500">{card.hint}</p>
            ) : (
              <span className="mt-2 h-4" />
            )}
          </article>
        );
      })}
    </div>
  );
}
