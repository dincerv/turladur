'use client';

import { Star, Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import type { DashboardPopularTour } from '@/components/features/acente-dashboard/types';
import { ACENTE_ROUTES } from '@/lib/panel-routes';

type PopularToursProps = {
  tours: DashboardPopularTour[];
};

function TourImage({ src, alt }: { src: string; alt: string }) {
  const initialSrc =
    typeof src === 'string' && src.trim() !== ''
      ? src
      : '/brand/mark-on-light.png';
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 text-sm text-neutral-500">
        Görsel yok
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      unoptimized={imageSrc.endsWith('.svg')}
      className="object-cover transition-transform duration-200 group-hover:scale-105"
      onError={() => {
        if (imageSrc !== '/brand/mark-on-light.png') {
          setImageSrc('/brand/mark-on-light.png');
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function PopularTours({ tours }: PopularToursProps) {
  return (
    <section
      aria-labelledby="popular-tours-heading"
      className="rounded-xl border border-neutral-200 bg-white shadow-sm"
    >
      <div className="border-b border-neutral-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="popular-tours-heading"
            className="text-base font-semibold text-neutral-900 sm:text-lg"
          >
            Popüler Turlar
          </h3>
          <Link
            href={ACENTE_ROUTES.tours}
            className="shrink-0 text-sm font-medium text-neutral-950 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            Tümünü Gör
          </Link>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500">
          Henüz listelenecek tur yok. İlk turunuzu ekleyerek başlayın.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 sm:p-6">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`${ACENTE_ROUTES.tours}/${tour.id}/edit`}
              className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <div className="relative h-48 overflow-hidden rounded-lg">
                <TourImage src={tour.image} alt={tour.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <h4 className="truncate text-lg font-semibold text-white">
                    {tour.title}
                  </h4>
                  <p className="truncate text-sm text-white/90">
                    {tour.location}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-400" aria-hidden />
                      <span className="ml-1 text-sm font-medium tabular-nums text-neutral-900">
                        {tour.rating.toFixed(1)}
                      </span>
                      <span className="ml-1 text-sm text-neutral-500">
                        ({tour.reviewCount} değerlendirme)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-neutral-400" aria-hidden />
                      <span className="ml-1 text-sm text-neutral-500">
                        {tour.guestCount} misafir
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-neutral-900">
                    {tour.price}
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-neutral-500">
                  <Calendar className="mr-1 h-4 w-4" aria-hidden />
                  {tour.reservationCount} rezervasyon
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default PopularTours;
