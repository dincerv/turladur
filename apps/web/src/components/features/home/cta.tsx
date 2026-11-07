'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, ShieldCheck, Store } from 'lucide-react';

const advantages = [
  { id: 1, text: 'Onaylı acenteler', icon: BadgeCheck },
  { id: 2, text: 'Acente adı turda görünür', icon: Store },
  { id: 3, text: 'Güvenli ödeme altyapısı', icon: ShieldCheck },
] as const;

export function CTA() {
  return (
    <section className="overflow-hidden border-y border-neutral-200/60 bg-gradient-to-b from-neutral-50 to-white py-16 md:py-20">
      <div className="relative z-10 container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-800">
            Keşfetmeye başla
          </div>
          <h2 className="mb-4 text-3xl leading-tight font-bold break-words text-neutral-900 md:text-4xl">
            Türkiye&apos;deki turları tek yerde karşılaştırın
          </h2>
          <p className="mb-8 text-base text-neutral-600 md:text-lg">
            Onaylı acentelerin turlarını inceleyin, fiyat ve koşulları net
            görün, güvenle rezerve edin.
          </p>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tours"
              className="group inline-flex items-center justify-center rounded-xl bg-neutral-950 px-8 py-3.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-neutral-800 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <span>Turları incele</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-8 py-3.5 text-sm font-medium text-neutral-800 shadow-lg transition-all duration-200 hover:bg-neutral-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <span>Ücretsiz üye ol</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {advantages.map((advantage) => {
              const Icon = advantage.icon;
              return (
                <div
                  key={advantage.id}
                  className="group flex items-center text-sm text-neutral-600"
                >
                  <Icon className="mr-2 h-5 w-5 flex-shrink-0 text-neutral-950" />
                  <span className="font-medium transition-colors duration-200 group-hover:text-neutral-800">
                    {advantage.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
