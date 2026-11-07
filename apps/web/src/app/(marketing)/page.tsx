import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { CTA } from '@/components/features/home/cta';
import { Destinations } from '@/components/features/home/destinations';
import { Hero } from '@/components/features/home/hero';
import { HotDeals } from '@/components/features/home/hot-deals';
import { MobileOfferPopup } from '@/components/features/home/mobile-offer-popup';
import { Newsletter } from '@/components/features/home/newsletter';
import { Stats } from '@/components/features/home/stats';
import { TourCard } from '@/components/features/tour/tour-card';
import { searchTours } from '@/services/catalog';

export const metadata: Metadata = {
  title: 'turta — Keşfet. Deneyimle. Hatırla.',
  description:
    'Türkiye turizm ekosistemi: turlar, güvenli rezervasyon ve şeffaf fiyatlar.',
  openGraph: {
    title: 'turta',
    description: 'Keşfet. Deneyimle. Hatırla.',
    locale: 'tr_TR',
    type: 'website',
  },
};

/**
 * Marketing home — legacy section order (Hero → Destinations → CTA → HotDeals →
 * Popüler Turlar → Stats → Testimonials → Newsletter). Data from Nest where available.
 */
export default async function HomePage() {
  let tours: Awaited<ReturnType<typeof searchTours>>['data'] = [];
  try {
    const result = await searchTours({ limit: 6, featured: true });
    tours = result.data ?? [];
    if (tours.length === 0) {
      const fallback = await searchTours({ limit: 6 });
      tours = fallback.data ?? [];
    }
  } catch {
    tours = [];
  }

  return (
    <>
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <Destinations />
      <CTA />
      <HotDeals />

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-800 md:text-3xl">
              Popüler Turlar
            </h2>
            <Link
              href="/tours"
              className="group flex items-center text-sm font-medium text-neutral-950 hover:text-neutral-700"
            >
              Tümünü Gör
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {tours.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Stats />
      <Newsletter />
      <MobileOfferPopup />
    </>
  );
}
