'use client';

import { Star, Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Tour {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  reservationCount: number;
  guestCount: number;
  price: string;
  image: string;
}

interface PopularToursProps {
  tours: Tour[];
}

function TourImage({ src, alt }: { src: string; alt: string }) {
  const initialSrc =
    typeof src === 'string' && src.trim() !== ''
      ? src
      : '/brand/mark-on-light.png';
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-sm text-gray-500">
        Görsel yok
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized={imageSrc.endsWith('.svg')}
      className="object-cover group-hover:scale-105 transition-transform duration-200"
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
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Popüler Turlar
          </h3>
          <Link
            href="/acente/tours"
            className="text-sm font-medium text-neutral-950 underline-offset-2 hover:underline"
          >
            Tümünü Gör
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {tours.map((tour) => (
          <Link
            key={tour.id}
            href={`/acente/tours/${tour.id}/edit`}
            className="group block"
          >
            <div className="relative h-48 rounded-lg overflow-hidden">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {tour.rating}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({tour.reviewCount} değerlendirme)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="ml-1 text-sm text-gray-500">
                      {tour.guestCount} misafir
                    </span>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {tour.price}
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {tour.reservationCount} rezervasyon
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default PopularTours;
