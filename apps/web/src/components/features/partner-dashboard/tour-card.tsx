'use client';

import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';

export interface TourCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  duration: string;
  maxParticipants: number;
  imageUrl: string;
  status: 'active' | 'draft' | 'archived';
  rating?: number;
  reservationCount?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  listView?: boolean;
}

export function TourCard({
  id,
  title,
  price,
  location,
  duration,
  maxParticipants,
  imageUrl,
  status,
  rating,
  reservationCount,
  onEdit,
  onDelete,
  listView = false,
}: TourCardProps) {
  const resolvedImage = resolveMediaUrl(imageUrl) || '/brand/mark-on-light.png';
  const unoptimized = shouldUnoptimizeMedia(resolvedImage);

  const statusConfig = {
    active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      label: 'Aktif',
    },
    draft: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Taslak',
    },
    archived: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Arşivlenmiş',
    },
  };

  const { bg, text, label } = statusConfig[status];

  // Liste görünümü için kart tasarımı
  if (listView) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group transition-all hover:shadow-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="relative sm:w-48 sm:h-32 mb-4 sm:mb-0 overflow-hidden rounded-lg">
            <Image
              src={resolvedImage}
              alt={title}
              fill
              unoptimized={unoptimized}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100%, 192px"
            />
            <div className="absolute top-2 right-2">
              <span
                className={`${bg} ${text} px-2 py-0.5 text-xs font-medium rounded-full`}
              >
                {label}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 line-clamp-1 mb-1 group-hover:text-indigo-700 transition-colors">
              {title}
            </h3>

            <div className="mb-2 flex items-baseline">
              <span className="text-lg font-bold text-indigo-600">{price}</span>
              <span className="text-xs text-gray-500 ml-1">/kişi</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                <span>Maks. {maxParticipants} kişi</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                {rating && (
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) =>
                        i < Math.floor(rating) ? (
                          <Star
                            key={i}
                            className="w-3 h-3 text-amber-400 fill-amber-400"
                          />
                        ) : i < rating ? (
                          <div key={i} className="relative w-3 h-3">
                            <Star
                              className="absolute w-3 h-3 text-amber-400 fill-amber-400 overflow-hidden"
                              style={{
                                clipPath: `inset(0 ${100 - (rating - Math.floor(rating)) * 100}% 0 0)`,
                              }}
                            />
                            <Star className="w-3 h-3 text-gray-300" />
                          </div>
                        ) : (
                          <Star key={i} className="w-3 h-3 text-gray-300" />
                        ),
                      )}
                    </div>
                    <span className="ml-1 text-xs font-medium text-gray-600">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {reservationCount && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Calendar className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                    <span>{reservationCount} rezervasyon</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/acente/tours/${id}`}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  Detaylar
                </Link>

                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(id)}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                    aria-label="Düzenle"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ) : (
                  <Link
                    href={`/acente/tours/${id}/edit`}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                    aria-label="Düzenle"
                  >
                    <Pencil className="h-3 w-3" />
                  </Link>
                )}

                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(id)}
                    className="inline-flex items-center rounded-lg border border-red-200 bg-white p-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    aria-label="Turu iptal et"
                    title="Turu iptal et"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal grid görünümü
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group transition-all hover:shadow-md">
      <div className="relative">
        <div className="aspect-[16/9] relative overflow-hidden">
          <Image
            src={resolvedImage}
            alt={title}
            fill
            unoptimized={unoptimized}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`${bg} ${text} px-2.5 py-1 text-xs font-medium rounded-full`}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-800 line-clamp-1 mb-2 group-hover:text-indigo-700 transition-colors">
          {title}
        </h3>

        <div className="mb-3 flex items-baseline">
          <span className="text-xl font-bold text-indigo-600">{price}</span>
          <span className="text-xs text-gray-500 ml-1">/kişi</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
            <span>Maks. {maxParticipants} kişi</span>
          </div>
        </div>

        {(rating || reservationCount) && (
          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            {rating && (
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) =>
                    i < Math.floor(rating) ? (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                      />
                    ) : i < rating ? (
                      <div key={i} className="relative w-3.5 h-3.5">
                        <Star
                          className="absolute w-3.5 h-3.5 text-amber-400 fill-amber-400 overflow-hidden"
                          style={{
                            clipPath: `inset(0 ${100 - (rating - Math.floor(rating)) * 100}% 0 0)`,
                          }}
                        />
                        <Star className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    ) : (
                      <Star key={i} className="w-3.5 h-3.5 text-gray-300" />
                    ),
                  )}
                </div>
                <span className="ml-1 text-xs font-medium text-gray-600">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            {reservationCount && (
              <div className="flex items-center text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />
                <span>{reservationCount} rezervasyon</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <Link
            href={`/acente/tours/${id}`}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            Detaylar
          </Link>

          <div className="flex space-x-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(id)}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                aria-label="Düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href={`/acente/tours/${id}/edit`}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                aria-label="Düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}

            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="inline-flex items-center rounded-lg border border-red-200 bg-white p-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                aria-label="Turu iptal et"
                title="Turu iptal et"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TourCard;
