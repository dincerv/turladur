'use client';

import Image from 'next/image';
import {
  Building2 as BuildingOfficeIcon,
  CalendarDays as CalendarDaysIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clock as ClockIcon,
  Image as PhotoIcon,
  Map as MapIcon,
  MapPin as MapPinIcon,
  ShieldCheck as ShieldCheckIcon,
  Users as UserGroupIcon,
} from 'lucide-react';
import OperatorReviewsSection from '@/components/features/tour-operator/OperatorReviewsSection';
import TourItineraryMobile from '@/components/features/tour/itinerary/tour-itinerary-mobile';
import { stripDayPrefixFromTitle } from '@/components/features/tour/itinerary/normalize-itinerary';
import { getDestinationLabel, sanitizePlainText } from './tour-detail.helpers';
import { TourDetailExpandableText } from './tour-detail-expandable-text';
import { TourDetailGallery } from './tour-detail-gallery';
import { useTourDetailUi } from './tour-detail-context';
import type { ItineraryItem } from './tour-detail.types';

/** Split from tour-detail-client.tsx (Faz 7) — left column; UI unchanged. */
export function TourDetailLeftColumn() {
  const {
    tour,
    destinations,
    itinerary,
    galleryImages,
    activePickupPoints,
    pickupSlideCount,
    pickupSlideClass,
    pickupSliderRef,
    scrollPickupSlider,
    tourReviews,
    tourReviewCount,
    tourAverageRating,
    tourOperator,
  } = useTourDetailUi();

  const getDestinationName = getDestinationLabel;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10 lg:col-span-2">
      {/* Tur Açıklaması */}
      <section className="min-w-0 rounded-xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:text-2xl">
          Tur Hakkında
        </h2>
        <TourDetailExpandableText
          text={tour.description}
          lines={5}
          emptyFallback="Bu tur için detaylı açıklama yakında eklenecektir."
        />
      </section>

      {/* Tur Programı ve Rotası */}
      <div id="itinerary" className="scroll-mt-24 min-w-0">
        <div className="md:hidden">
          <TourItineraryMobile
            itinerary={itinerary}
            destinations={destinations}
            images={tour.images}
            tourStartDate={tour.tourDates?.[0]?.startDate ?? null}
          />
        </div>

        <div className="hidden md:block bg-white rounded-xl overflow-hidden shadow-md border border-neutral-200/70 min-w-0">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
                <MapIcon className="h-7 w-7 text-neutral-950 mr-3" />
                <span>Tur Programı ve Rotası</span>
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-neutral-950"></div>
                  <span>Günlük Program</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Önemli Noktalar</span>
                </div>
              </div>
            </div>

            {Object.keys(itinerary).length > 0 ? (
              <div className="relative">
                {/* Rota Çizgisi */}
                <div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200"></div>

                {/* Günlük Program */}
                <div className="space-y-12">
                  {Object.entries(itinerary).map(
                    (
                      [day, content]: [string, ItineraryItem],
                      index: number,
                    ) => {
                      const dayNumberNum =
                        parseInt(day.replace('day', ''), 10) + 1;
                      const dayNumber = String(dayNumberNum);
                      const tourStartDate = tour.tourDates?.[0]?.startDate;
                      const currentDate = tourStartDate
                        ? new Date(
                            new Date(tourStartDate).setDate(
                              new Date(tourStartDate).getDate() + index,
                            ),
                          )
                        : null;
                      const formattedDate = currentDate
                        ? currentDate.toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : null;

                      const destination =
                        tour.destinations[index] || tour.destinations[0];
                      const destinationName = destination
                        ? getDestinationName(destination)
                        : '';

                      const rawTitle =
                        content.title ||
                        destinationName ||
                        `${dayNumber}. Gün programı`;
                      const displayTitle =
                        stripDayPrefixFromTitle(rawTitle, dayNumberNum) ||
                        destinationName ||
                        'Gün programı';

                      const dayImages = tour.images
                        ? tour.images.slice(index * 2, index * 2 + 2)
                        : [];

                      return (
                        <div
                          key={index}
                          className="relative flex gap-6 min-w-0"
                        >
                          <div className="flex-shrink-0 w-14 flex justify-center">
                            <div
                              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-950 ring-4 ring-white font-semibold text-lg"
                              aria-label={`${dayNumber}. gün`}
                            >
                              {dayNumber}
                            </div>
                          </div>

                          <div className="flex-grow min-w-0">
                            <div className="bg-white rounded-xl border border-neutral-200/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden min-w-0">
                              <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-100/50">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                                    {formattedDate && (
                                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 shrink-0">
                                        {formattedDate}
                                      </span>
                                    )}
                                    <h4 className="text-lg font-semibold text-gray-900 break-words min-w-0">
                                      {sanitizePlainText(displayTitle)}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="p-2 hover:bg-white rounded-lg transition-colors"
                                      title="Haritada Göster"
                                    >
                                      <MapPinIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                    {dayImages.length > 0 && (
                                      <button
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                        title="Fotoğrafları Görüntüle"
                                      >
                                        <PhotoIcon className="w-5 h-5 text-gray-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ana İçerik */}
                              <div className="p-5 min-w-0">
                                <p className="text-gray-600 text-sm mb-6 break-words [overflow-wrap:anywhere]">
                                  {sanitizePlainText(content.description) ||
                                    'Bu gün için detaylı program bilgisi yakında eklenecektir.'}
                                </p>

                                {/* Fotoğraflar */}
                                {dayImages.length > 0 && (
                                  <div className="mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      {dayImages.map(
                                        (image: string, imgIndex: number) => (
                                          <div
                                            key={imgIndex}
                                            className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                                          >
                                            <Image
                                              src={image}
                                              alt={`${content.title || destinationName} - ${imgIndex + 1}`}
                                              fill
                                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                              <div className="absolute bottom-3 left-3 right-3">
                                                <p className="text-white text-sm font-medium truncate">
                                                  {content.title ||
                                                    destinationName}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Öne Çıkan Özellikler */}
                                {content.highlights &&
                                  content.highlights.length > 0 && (
                                    <div className="mb-6">
                                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                                        Günün Öne Çıkanları
                                      </h5>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {content.highlights.map(
                                          (highlight: string, i: number) => (
                                            <div
                                              key={i}
                                              className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 bg-neutral-100/30 min-w-0"
                                            >
                                              <span className="text-lg shrink-0">
                                                ✨
                                              </span>
                                              <span className="text-sm text-gray-700 break-words [overflow-wrap:anywhere]">
                                                {highlight}
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Zaman Çizelgesi */}
                                {content.schedule &&
                                  content.schedule.length > 0 && (
                                    <div className="mb-6">
                                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                                        Günün Programı
                                      </h5>
                                      <div className="space-y-3">
                                        {content.schedule.map(
                                          (
                                            scheduleItem: {
                                              time?: string;
                                              activity?: string;
                                            },
                                            i: number,
                                          ) => (
                                            <div
                                              key={i}
                                              className="flex items-start gap-3 p-2.5 bg-neutral-100 rounded-lg border border-neutral-200 min-w-0"
                                            >
                                              <div className="p-2 bg-neutral-100 rounded-lg shrink-0">
                                                <ClockIcon className="w-4 h-4 text-neutral-950" />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 break-words">
                                                  {scheduleItem.time ||
                                                    `${i + 1}. Aktivite`}
                                                </p>
                                                <p className="text-xs text-gray-600 break-words [overflow-wrap:anywhere]">
                                                  {scheduleItem.activity ||
                                                    'Aktivite'}
                                                </p>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Alt Bilgiler */}
                                <div className="pt-4 border-t border-gray-100">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {/* Konum */}
                                    {destinationName && (
                                      <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                          <MapPinIcon className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Konum
                                          </p>
                                          <p className="text-sm font-medium text-gray-700 break-words">
                                            {destinationName}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Mesafe */}
                                    {content.distance && (
                                      <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-gray-600"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Mesafe
                                          </p>
                                          <p className="text-sm font-medium text-gray-700">
                                            {content.distance}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Aktivite Sayısı */}
                                    {content.highlights &&
                                      content.highlights.length > 0 && (
                                        <div className="flex items-center gap-2">
                                          <div className="p-2 bg-gray-100 rounded-lg">
                                            <CalendarDaysIcon className="w-4 h-4 text-gray-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">
                                              Aktiviteler
                                            </p>
                                            <p className="text-sm font-medium text-gray-700">
                                              {content.highlights.length}{' '}
                                              Aktivite
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                    {/* Tahmini Süre */}
                                    {content.duration && (
                                      <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                          <ClockIcon className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Süre
                                          </p>
                                          <p className="text-sm font-medium text-gray-700">
                                            {content.duration}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ) : (
              // Itinerary verisi yoksa varsayılan görünüm
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapIcon className="w-8 h-8 text-neutral-950" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Tur Programı Hazırlanıyor
                </h4>
                <p className="text-gray-600 mb-6">
                  Bu tur için detaylı günlük program yakında eklenecektir.
                </p>
                <div className="bg-neutral-100 rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-neutral-950">
                        1
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        Tur Başlangıcı
                      </h5>
                      <p className="text-sm text-gray-600">
                        Buluşma noktasında toplanma ve tur başlangıcı
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-neutral-950">
                        2
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        Destinasyon Ziyaretleri
                      </h5>
                      <p className="text-sm text-gray-600">
                        Planlanan destinasyonlarda rehber eşliğinde geziler
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-neutral-950">
                        3
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Tur Sonu</h5>
                      <p className="text-sm text-gray-600">
                        Tur sonunda ayrılış ve dönüş
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TourDetailGallery
        images={galleryImages}
        tourName={tour.name}
        destinationLabels={destinations}
      />

      {/* Kalkış Noktası Bilgileri — noktalar slider, uyarılar sabit */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <h3 className="flex min-w-0 items-center text-base font-semibold text-emerald-800 sm:text-lg">
            <MapPinIcon className="mr-2 h-5 w-5 shrink-0 text-emerald-600 sm:h-6 sm:w-6" />
            <span className="leading-snug">
              Kalkış Noktaları ve Buluşma Bilgileri
            </span>
          </h3>
          {pickupSlideCount > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollPickupSlider('prev')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
                aria-label="Önceki kalkış noktası"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollPickupSlider('next')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
                aria-label="Sonraki kalkış noktası"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div
          ref={pickupSliderRef}
          className="mb-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tour.meetingPoint ? (
            <div
              data-pickup-slide
              className={`${pickupSlideClass} group relative overflow-hidden rounded-lg border border-emerald-100 bg-white p-3.5 sm:p-4`}
            >
              <div className="absolute right-0 top-0 -z-0 h-16 w-16 rounded-bl-[100px] bg-emerald-100 transition-colors group-hover:bg-emerald-200" />
              <div className="relative z-10">
                <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Ana Buluşma Noktası
                </div>
                <h5 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  {tour.meetingPoint}
                </h5>
                {tour.meetingPointAddress ? (
                  <p className="mb-2.5 text-xs text-gray-600 sm:text-sm">
                    {tour.meetingPointAddress}
                  </p>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  {tour.meetingTime ? (
                    <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Toplanma Saati: {tour.meetingTime}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                    <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>
                      Rehber:{' '}
                      {tour.tourOperator?.companyName || 'Tur Operatörü'}{' '}
                      Rehberi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activePickupPoints.length > 0 ? (
            activePickupPoints.map((point, index) => (
              <div
                key={point.id}
                data-pickup-slide
                className={`${pickupSlideClass} group relative overflow-hidden rounded-lg border border-emerald-100 bg-white p-3.5 sm:p-4`}
              >
                <div className="absolute right-0 top-0 -z-0 h-16 w-16 rounded-bl-[100px] bg-emerald-100 transition-colors group-hover:bg-emerald-200" />
                <div className="relative z-10">
                  <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {index + 1}. Kalkış Noktası
                  </div>
                  <h5 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                    {point.city} - {point.location}
                  </h5>
                  {point.description ? (
                    <p className="mb-2.5 text-xs text-gray-600 sm:text-sm">
                      {point.description}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Toplanma Saati: {point.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                      <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>
                        Rehber:{' '}
                        {tour.tourOperator?.companyName || 'Tur Operatörü'}{' '}
                        Rehberi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : !tour.meetingPoint ? (
            <div
              data-pickup-slide
              className={`${pickupSlideClass} group relative overflow-hidden rounded-lg border border-emerald-100 bg-white p-3.5 sm:p-4`}
            >
              <div className="absolute right-0 top-0 -z-0 h-16 w-16 rounded-bl-[100px] bg-emerald-100 transition-colors group-hover:bg-emerald-200" />
              <div className="relative z-10">
                <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Kalkış Noktası
                </div>
                <h5 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  {tour.departureCity || 'İstanbul'} - Merkez
                </h5>
                <p className="mb-2.5 text-xs text-gray-600 sm:text-sm">
                  Tur operatörü tarafından belirlenecek
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Toplanma Saati: Belirtilecek</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700 sm:text-sm">
                    <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>
                      Rehber:{' '}
                      {tour.tourOperator?.companyName || 'Tur Operatörü'}{' '}
                      Rehberi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Önemli Hatırlatmalar — sabit, slider dışında */}
        <div className="rounded-lg border border-emerald-100 bg-white p-3.5 sm:p-4">
          <h4 className="mb-2.5 flex items-center text-sm font-medium text-gray-900 sm:mb-3 sm:text-base">
            <ShieldCheckIcon className="mr-2 h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5" />
            Önemli Hatırlatmalar
          </h4>
          <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-600 sm:grid-cols-2 sm:gap-3 sm:text-sm">
            <div className="space-y-1.5">
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Tüm kalkış noktalarında profesyonel rehber eşliğinde karşılama
                yapılacaktır.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Lütfen belirtilen saatlerden en az 15 dakika önce kalkış
                noktasında hazır bulununuz.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Kalkış saatinden 10 dakika sonra hareket edilecektir.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Rehberlerimiz renkli şapkaları ile kolayca tanınabilir
                olacaktır.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Acil durumlar için rehber iletişim numarası tur başlangıç
                tarihinden 1 gün önce SMS ile paylaşılacaktır.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-600">•</span>
                Bagajlarınız için otobüste yeterli alan mevcuttur.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Konaklama Bilgisi - Kısa */}
      {tour.accommodation?.name && (
        <div className="mb-10">
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="w-5 h-5 text-neutral-950 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Konaklama:
                </span>
                <span className="text-base font-semibold text-gray-900 ml-2">
                  {tour.accommodation.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {tourReviewCount > 0 && (
        <OperatorReviewsSection
          reviews={tourReviews}
          rating={tourAverageRating}
          reviewCount={tourReviewCount}
          variant="main"
          operatorName={tourOperator?.companyName}
        />
      )}
    </div>
  );
}
