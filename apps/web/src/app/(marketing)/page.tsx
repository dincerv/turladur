import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AgencyCtaStrip } from '@/components/features/home/agency-cta-strip';
import { Destinations } from '@/components/features/home/destinations';
import { Hero } from '@/components/features/home/hero';
import {
  HotDeals,
  pickShowcaseActivities,
  pickShowcaseTours,
} from '@/components/features/home/hot-deals';
import { MobileOfferPopup } from '@/components/features/home/mobile-offer-popup';
import { Newsletter } from '@/components/features/home/newsletter';
import { Stats } from '@/components/features/home/stats';
import { searchExperiences } from '@/services/activity';
import { searchTours } from '@/services/catalog';

export const metadata: Metadata = {
  title: 'Turta — Türkiye turları ve deneyimleri',
  description:
    'Onaylı acentelerin turlarını karşılaştırın, şeffaf fiyatlarla güvenle rezerve edin.',
  openGraph: {
    title: 'Turta',
    description: 'Türkiye turları ve deneyimleri tek yerde.',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default async function HomePage() {
  let tours: Awaited<ReturnType<typeof searchTours>>['data'] = [];
  let activities: Awaited<ReturnType<typeof searchExperiences>>['data'] = [];

  try {
    const result = await searchTours({ limit: 48, sortBy: 'rating' });
    tours = pickShowcaseTours(result.data ?? [], 8);
  } catch {
    tours = [];
  }

  try {
    const result = await searchExperiences({ limit: 48 });
    activities = pickShowcaseActivities(result.data ?? [], 8);
  } catch {
    activities = [];
  }

  return (
    <>
      <Suspense
        fallback={
          <div
            className="min-h-[70vh] animate-pulse bg-neutral-200 md:min-h-[80vh]"
            aria-hidden
          />
        }
      >
        <Hero />
      </Suspense>
      <Destinations />
      <HotDeals initialTours={tours} initialActivities={activities} />
      <Stats />
      <AgencyCtaStrip />
      <Newsletter />
      <MobileOfferPopup />
    </>
  );
}
