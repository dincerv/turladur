'use client';

import { useState } from 'react';
import {
  Building2 as BuildingOfficeIcon,
  CheckCircle as CheckCircleIcon,
  ChevronDown,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  ShieldCheck as ShieldCheckIcon,
  Users as UserGroupIcon,
  XCircle as XCircleIcon,
} from 'lucide-react';
import { ReviewPersonaCard } from '@/components/features/tour/reviews/review-persona-card';
import { TourReviews } from '@/components/features/review/tour-reviews';
import { sanitizePlainText } from './tour-detail.helpers';
import { TourDetailExpandableText } from './tour-detail-expandable-text';
import { useTourDetailUi } from './tour-detail-context';
import { TourRoutePanel } from './tour-route-panel';

const REMINDERS = [
  'Tüm kalkış noktalarında profesyonel rehber eşliğinde karşılama yapılacaktır.',
  'Lütfen belirtilen saatlerden en az 15 dakika önce kalkış noktasında hazır bulununuz.',
  'Kalkış saatinden 10 dakika sonra hareket edilecektir.',
  'Rehberlerimiz renkli şapkaları ile kolayca tanınabilir olacaktır.',
  'Acil durumlar için rehber iletişim numarası tur başlangıç tarihinden 1 gün önce SMS ile paylaşılacaktır.',
  'Bagajlarınız için otobüste yeterli alan mevcuttur.',
] as const;

/** Sol içerik akışı — karar odaklı sıralama. */
export function TourDetailLeftColumn() {
  const {
    tour,
    destinations,
    itinerary,
    inclusions,
    exclusions,
    activePickupPoints,
    routeStops,
  } = useTourDetailUi();
  const [remindersOpen, setRemindersOpen] = useState(false);
  const hasItinerary = Object.keys(itinerary).length > 0;
  const hasProgramModule =
    routeStops.length > 0 || activePickupPoints.length > 0 || hasItinerary;
  const showAccommodation =
    tour.duration > 1 &&
    String(tour.tourType ?? '').toLowerCase() !== 'günübirlik tur';

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip sm:space-y-8">
      {/* 1. Tur Hakkında */}
      <section
        className="min-w-0 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6"
        data-testid="tour-detail-about"
      >
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          Tur Hakkında
        </h2>
        <TourDetailExpandableText
          text={tour.description}
          lines={5}
          emptyFallback="Bu tur için detaylı açıklama yakında eklenecektir."
        />
        {tour.accommodation?.name ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3">
            <BuildingOfficeIcon className="h-5 w-5 shrink-0 text-neutral-800" />
            <div>
              <p className="text-sm font-medium text-neutral-500">Konaklama</p>
              <p className="text-base font-semibold text-neutral-900">
                {tour.accommodation.name}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* 2. Harita (koşullu) + akordeon günlük program */}
      <div id="itinerary" className="scroll-mt-24 min-w-0 space-y-4">
        {hasProgramModule ? (
          <TourRoutePanel
            routeStops={routeStops}
            pickupPoints={activePickupPoints}
            itinerary={itinerary}
            durationDays={tour.duration}
            showAccommodation={showAccommodation}
            regionHints={[
              tour.departureCity,
              tour.region,
              ...destinations,
              tour.name,
            ]}
          />
        ) : (
          <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-medium text-neutral-800">
              Tur programı hazırlanıyor
            </p>
            <p className="mt-1 text-base text-neutral-500">
              Günlük rota ve duraklar yakında eklenecek.
            </p>
          </section>
        )}
      </div>

      {/* 3. Dahil olanlar / olmayanlar */}
      <section
        className="min-w-0 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6"
        data-testid="tour-detail-inclusions"
      >
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-neutral-950">
          Dahil Olanlar / Olmayanlar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-emerald-800">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Dahil olanlar
            </h3>
            <ul className="space-y-2">
              {inclusions.length > 0 ? (
                inclusions.map((item, index) => (
                  <li
                    key={`inc-${index}`}
                    className="flex items-start gap-2 text-base text-neutral-700"
                  >
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="break-words [overflow-wrap:anywhere]">
                      {sanitizePlainText(item)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-base text-neutral-500">Bilgi yakında.</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-800">
              <XCircleIcon className="h-4 w-4 text-neutral-500" />
              Dahil olmayanlar
            </h3>
            <ul className="space-y-2">
              {exclusions.length > 0 ? (
                exclusions.map((item, index) => (
                  <li
                    key={`exc-${index}`}
                    className="flex items-start gap-2 text-base text-neutral-700"
                  >
                    <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span className="break-words [overflow-wrap:anywhere]">
                      {sanitizePlainText(item)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-base text-neutral-500">Bilgi yakında.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Kalkış + hatırlatmalar */}
      <section
        className="w-full min-w-0 overflow-hidden rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-sm sm:p-5"
        data-testid="tour-detail-meeting"
      >
        <h3 className="mb-3 flex items-center text-base font-semibold text-emerald-900 sm:text-lg">
          <MapPinIcon
            className="mr-2 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <span>Kalkış Noktaları ve Önemli Hatırlatmalar</span>
        </h3>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tour.meetingPoint ? (
            <div className="rounded-xl border border-emerald-100 bg-white p-3.5 sm:p-4">
              <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Ana buluşma
              </div>
              <h5 className="mb-1 text-sm font-medium text-neutral-900 sm:text-base">
                {tour.meetingPoint}
              </h5>
              {tour.meetingPointAddress ? (
                <p className="mb-2.5 text-xs text-neutral-600 sm:text-sm">
                  {tour.meetingPointAddress}
                </p>
              ) : null}
              <div className="flex flex-col gap-1.5 text-xs text-neutral-700 sm:text-sm">
                {tour.meetingTime ? (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Toplanma: {tour.meetingTime}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Rehber: {tour.tourOperator?.companyName || 'Tur Operatörü'}{' '}
                    Rehberi
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {activePickupPoints.length > 0 ? (
            activePickupPoints.slice(0, 4).map((point, index) => (
              <div
                key={point.id}
                className="rounded-xl border border-emerald-100 bg-white p-3.5 sm:p-4"
              >
                <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {index + 1}. Biniş
                </div>
                <h5 className="mb-1 text-sm font-medium text-neutral-900 sm:text-base">
                  {point.city} — {point.location}
                </h5>
                {point.description ? (
                  <p className="mb-2.5 text-xs text-neutral-600 sm:text-sm">
                    {point.description}
                  </p>
                ) : null}
                <div className="flex flex-col gap-1.5 text-xs text-neutral-700 sm:text-sm">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Toplanma: {point.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>
                      Rehber:{' '}
                      {tour.tourOperator?.companyName || 'Tur Operatörü'}{' '}
                      Rehberi
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : !tour.meetingPoint ? (
            <div className="rounded-xl border border-emerald-100 bg-white p-3.5 sm:p-4 sm:col-span-2">
              <h5 className="mb-1 text-sm font-medium text-neutral-900">
                {tour.departureCity || 'İstanbul'} — Merkez
              </h5>
              <p className="text-xs text-neutral-600 sm:text-sm">
                Detaylı buluşma noktası tur operatörü tarafından paylaşılacak.
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white">
          <button
            type="button"
            onClick={() => setRemindersOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left sm:px-4 sm:py-3.5"
            data-testid="tour-detail-reminders-toggle"
            aria-expanded={remindersOpen}
          >
            <span className="flex min-w-0 items-center text-sm font-medium text-neutral-900 sm:text-base">
              <ShieldCheckIcon className="mr-2 h-4 w-4 shrink-0 text-emerald-600" />
              <span className="truncate">Önemli hatırlatmalar</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                {REMINDERS.length} hatırlatma
              </span>
              <ChevronDown
                className={`h-4 w-4 text-emerald-800 transition ${remindersOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </button>
          {remindersOpen ? (
            <ul className="space-y-1.5 border-t border-emerald-50 px-3.5 pb-3.5 text-xs text-neutral-600 sm:px-4 sm:pb-4 sm:text-sm">
              {REMINDERS.map((text) => (
                <li key={text} className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-600">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* 5. Persona uygunluk — yorumlardan hemen önce */}
      {tour?.id ? (
        <div data-testid="tour-detail-persona">
          <ReviewPersonaCard tourId={tour.id} />
        </div>
      ) : null}

      {/* 6. Yorumlar */}
      {tour?.id ? (
        <div data-testid="tour-detail-reviews">
          <TourReviews tourId={tour.id} />
        </div>
      ) : null}
    </div>
  );
}
