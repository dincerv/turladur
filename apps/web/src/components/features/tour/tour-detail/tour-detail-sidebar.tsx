'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle as ExclamationCircleIcon,
  ArrowRight as ArrowRightIcon,
  Building2 as BuildingOfficeIcon,
  CalendarDays as CalendarDaysIcon,
  CheckCircle as CheckCircleIcon,
  Globe as GlobeAltIcon,
  Heart as HeartIcon,
  MapPin as MapPinIcon,
  MessageCircle as ChatBubbleLeftRightIcon,
  ShieldCheck as ShieldCheckIcon,
  Users as UserGroupIcon,
  XCircle as XCircleIcon,
} from 'lucide-react';
import MembershipBadge from '@/components/features/tour/membership-badge';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { formatPriceTry, sanitizePlainText } from './tour-detail.helpers';
import { TourDetailExpandableText } from './tour-detail-expandable-text';
import { useTourDetailUi } from './tour-detail-context';
import { renderStars } from './render-stars';

/** Split from tour-detail-client.tsx (Faz 7) — sticky sidebar; UI unchanged. */
export function TourDetailSidebar() {
  const {
    tour,
    tourOperator,
    otherTours,
    availableTourDates,
    selectedTourDate,
    showDateSelectionHint,
    inclusions,
    exclusions,
    healthPrivileges,
    handleDateSelect,
    containerRef,
  } = useTourDetailUi();

  const operatorLogoUrl = tourOperator
    ? resolveMediaUrl(tourOperator.logo) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(tourOperator.companyName || 'Operator')}&background=0EA5E9&color=fff`
    : '';

  const displayUnitPrice =
    selectedTourDate?.price != null ? selectedTourDate.price : tour.price;

  return (
    <aside className="flex w-full min-w-0 flex-col space-y-6 self-start overflow-hidden lg:sticky lg:top-24 lg:col-span-1 lg:space-y-8">
      {/* Rezervasyon Kartı — desktop sticky (page scroll only; no nested scroll) */}
      <div
        id="booking"
        className="w-full min-w-0 scroll-mt-28 overflow-hidden rounded-xl border border-neutral-200/70 bg-white p-4 shadow-md sm:p-5"
      >
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center text-xl font-semibold text-gray-900">
              <CalendarDaysIcon className="mr-2 h-5 w-5 flex-shrink-0 text-neutral-950" />
              <span className="truncate">Rezervasyon</span>
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                Ücretsiz İptal
              </div>
              <div className="inline-flex items-center rounded-full border border-neutral-200/70 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-800">
                Anında Onay
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {selectedTourDate ? 'Seçilen tarih fiyatı' : 'Kişi başı fiyat'}
            </p>
            <p
              className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl"
              aria-readonly="true"
            >
              {formatPriceTry(displayUnitPrice)}
            </p>
            <p className="mt-0.5 text-sm text-neutral-500">/ kişi</p>
          </div>
        </div>

        {/* Tur Tarihleri */}
        <div className="relative group">
          {showDateSelectionHint && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none"
              role="tooltip"
            >
              <div className="relative bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap animate-bounce-subtle">
                Tarih seçmek için kartlara tıklayın
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-red-600 rotate-45" />
              </div>
            </div>
          )}
          <div
            className={`mb-0 rounded-lg bg-neutral-50/60 p-3 transition-all duration-300 sm:p-4 ${
              showDateSelectionHint
                ? 'animate-pulse border-2 border-red-500 ring-2 ring-red-100'
                : 'border border-neutral-200/70'
            }`}
            title={
              showDateSelectionHint
                ? 'Rezervasyon için bir tur tarihi seçin'
                : undefined
            }
          >
            {showDateSelectionHint ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                <span>Önce tarih seçiniz</span>
              </div>
            ) : null}
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-800">
                Tur Tarihleri
              </h3>
              <div className="shrink-0 text-xs text-neutral-600 sm:text-sm">
                {availableTourDates.length} tarih
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {availableTourDates.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarDaysIcon className="mx-auto mb-3 h-10 w-10 text-neutral-400" />
                  <p className="text-sm text-neutral-600">
                    Şu anda mevcut tur tarihi bulunmamaktadır.
                  </p>
                </div>
              ) : (
                availableTourDates.map((date) => {
                  const isLimited = date.availableSeats <= 5;
                  const startDate = new Date(date.startDate);
                  const endDate = new Date(date.endDate);
                  const hasEarlyBirdDiscount =
                    date.earlyBirdDiscount &&
                    date.earlyBirdDeadline &&
                    new Date() <= new Date(date.earlyBirdDeadline);
                  const hasLastMinuteDiscount =
                    date.lastMinuteDiscount &&
                    date.lastMinuteStart &&
                    new Date() >= new Date(date.lastMinuteStart);

                  return (
                    <button
                      key={date.id}
                      type="button"
                      onClick={() => {
                        handleDateSelect(date);
                      }}
                      className={`flex w-full min-w-0 flex-col gap-2 rounded-lg border bg-white p-3 text-left transition-all duration-150 ease-out hover:shadow-sm active:scale-[0.99] ${
                        selectedTourDate?.id === date.id
                          ? 'border-neutral-950 shadow-sm ring-2 ring-neutral-200'
                          : showDateSelectionHint
                            ? 'border-red-200 hover:border-red-400 hover:bg-red-50/30'
                            : 'border-neutral-200/70 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <CalendarDaysIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-950" />
                          <div className="min-w-0">
                            <div className="break-words text-sm font-medium text-neutral-900 [overflow-wrap:anywhere]">
                              {startDate.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' – '}
                              {endDate.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                        <div
                          className="shrink-0 text-base font-semibold text-neutral-800"
                          aria-readonly="true"
                        >
                          {formatPriceTry(date.price)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-6">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${isLimited ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                        >
                          {isLimited
                            ? `Son ${date.availableSeats} kontenjan!`
                            : `${date.availableSeats} kişilik kontenjan`}
                        </span>
                        {hasEarlyBirdDiscount ? (
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                            %{date.earlyBirdDiscount} Erken Rezervasyon
                          </span>
                        ) : null}
                        {hasLastMinuteDiscount ? (
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            %{date.lastMinuteDiscount} Son Dakika
                          </span>
                        ) : null}
                        {date.minParticipants ? (
                          <span className="text-xs text-neutral-500">
                            Min. {date.minParticipants} kişi
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tur Operatörü Bilgileri - ikas Style */}
      {tourOperator && (
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/70 bg-white p-4 shadow-md sm:p-5">
          <div className="mb-4 space-y-2">
            <h2 className="flex min-w-0 items-center text-xl font-semibold text-gray-900">
              <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5 flex-shrink-0 text-neutral-950" />
              <span className="truncate">Tur Operatörü</span>
            </h2>
            {(tourOperator.reviewCount ?? 0) > 0 ? (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500">
                <div className="flex items-center text-yellow-400">
                  {renderStars(tourOperator.rating ?? 0, 'sm')}
                </div>
                <span className="font-medium">
                  ({(tourOperator.rating ?? 0).toFixed(1)}/5)
                </span>
                <span aria-hidden>•</span>
                <span>{tourOperator.reviewCount} değerlendirme</span>
              </div>
            ) : null}
          </div>

          <div className="mb-4 rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md">
                <Image
                  src={operatorLogoUrl}
                  alt={tourOperator.companyName || 'Tur Operatörü'}
                  width={48}
                  height={48}
                  unoptimized={shouldUnoptimizeMedia(operatorLogoUrl)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="break-words text-lg font-semibold text-gray-900 [overflow-wrap:anywhere]">
                    {sanitizePlainText(tourOperator.companyName)}
                  </h4>
                  {tourOperator.membershipTier ? (
                    <MembershipBadge tier={tourOperator.membershipTier} />
                  ) : null}
                </div>
                <Link
                  href={`/tour-operator/${tourOperator.id}#tours`}
                  className="text-sm text-neutral-950 transition-colors hover:text-neutral-800"
                >
                  Tüm turları gör
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-4">
            <TourDetailExpandableText
              text={tourOperator.description || ''}
              lines={3}
              emptyFallback="Tur operatörü hakkında bilgi bulunmamaktadır."
            />
          </div>

          <Link
            href={`/tour-operator/${tourOperator.id}`}
            className="group flex items-center justify-between rounded-lg border border-neutral-200/70 p-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-100/50 hover:text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:ring-offset-1"
          >
            <span className="flex items-center">
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              <span>Operatör detayları</span>
            </span>
            <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/70 bg-white p-4 shadow-md sm:p-5">
        <div className="mb-4">
          <h2 className="flex min-w-0 items-center text-lg font-semibold text-gray-900 sm:text-xl">
            <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-neutral-950" />
            <span className="break-words [overflow-wrap:anywhere]">
              Dahil Olanlar / Olmayanlar
            </span>
          </h2>
        </div>

        {/* Simplified Included Area */}
        <div className="bg-emerald-50/60 p-5 rounded-lg border border-emerald-200/70 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
            <span>Dahil Olanlar</span>
          </h3>
          <ul className="space-y-2.5">
            {inclusions.map((item, index) => (
              <li
                key={index}
                className="flex items-start p-3 rounded-md bg-white/70 border border-emerald-100"
              >
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 flex-shrink-0" />
                <span className="break-words text-sm font-medium text-neutral-700 [overflow-wrap:anywhere]">
                  {sanitizePlainText(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Simplified Excluded Area */}
        <div className="bg-red-50/60 p-5 rounded-lg border border-red-200/70">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
            <span>Dahil Olmayanlar</span>
          </h3>
          <ul className="space-y-2.5">
            {exclusions.map((item, index) => (
              <li
                key={index}
                className="flex items-start p-3 rounded-md bg-white/70 border border-red-100"
              >
                <XCircleIcon className="w-4 h-4 text-red-500 mr-2.5 mt-0.5 flex-shrink-0" />
                <span className="break-words text-sm font-medium text-neutral-700 [overflow-wrap:anywhere]">
                  {sanitizePlainText(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {healthPrivileges.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200/70 shadow-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <HeartIcon className="h-6 w-6 mr-2.5 text-neutral-950 flex-shrink-0" />
              <span>Sağlık Ayrıcalıkları</span>
            </h2>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Bu turda aşağıdaki sağlık durumlarına saygı duyulur ve destek
            sağlanır.
          </p>
          <div className="bg-sky-50/60 p-5 rounded-lg border border-sky-200/70">
            <ul className="space-y-2.5">
              {healthPrivileges.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start p-3 rounded-md bg-white/70 border border-sky-100"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-sky-600 mr-2.5 mt-0.5 flex-shrink-0" />
                  <span className="break-words text-sm font-medium text-neutral-700 [overflow-wrap:anywhere]">
                    {sanitizePlainText(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="@container w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/70 bg-white shadow-md"
      >
        {/* Header - Daha kompakt */}
        <div className="border-b border-neutral-100 px-5 py-4 flex items-center justify-between bg-gray-50/80">
          <h2 className="text-base font-semibold text-gray-800 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-neutral-950 flex-shrink-0" />
            <span>Acentenin Diğer Turları</span>
          </h2>
          <Link
            href={`/tour-operator/${tour.tourOperator.id}`}
            className="text-sm font-medium text-neutral-950 hover:text-neutral-800 transition-colors flex items-center group"
          >
            <span className="mr-1">Tümünü Gör</span>
            <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </div>

        {/* Tours List - Yatay düzen */}
        <div className="p-5 space-y-4">
          {otherTours.map((otherTour) => (
            <div
              key={otherTour.id}
              className="flex flex-col @sm:flex-row @sm:items-center gap-4 p-4 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-all bg-white hover:shadow-sm group"
            >
              {/* Tur Resmi */}
              <div className="relative w-full h-40 @sm:w-32 @sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={otherTour.images[0]}
                  alt={otherTour.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {otherTour.discount && otherTour.discount > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                    %{otherTour.discount} İndirim
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <MembershipBadge
                    tier={otherTour.tourOperator?.membershipTier}
                    variant="onImage"
                  />
                </div>
              </div>

              {/* Tur Bilgileri */}
              <div className="flex-grow min-w-0">
                <h3 className="mb-2 truncate text-base font-medium text-gray-900">
                  {sanitizePlainText(otherTour.name)}
                </h3>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      {typeof otherTour.destinations[0] === 'string'
                        ? otherTour.destinations[0]
                        : otherTour.destinations[0]?.city || 'Türkiye'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                    <span>{otherTour.duration} Gün</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                    <span>Maks. {otherTour.maxParticipants || 20} kişi</span>
                  </div>
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                    <span>{otherTour.tourType || 'Kültür Turu'}</span>
                  </div>
                </div>
              </div>

              {/* Fiyat ve Detay Butonu */}
              <div className="flex @sm:flex-col items-center @sm:items-end justify-between @sm:justify-start gap-2 flex-shrink-0 pt-3 @sm:pt-0 @sm:pl-4 border-t @sm:border-t-0 @sm:border-l border-gray-100">
                <div className="text-left @sm:text-right">
                  <div
                    className="text-lg font-semibold text-gray-900"
                    aria-readonly="true"
                  >
                    {formatPriceTry(otherTour.price)}
                  </div>
                  {otherTour.discount && otherTour.discount > 0 ? (
                    <div className="text-sm text-gray-500 line-through">
                      {formatPriceTry(
                        otherTour.price * (1 + otherTour.discount / 100),
                      )}
                    </div>
                  ) : null}
                </div>
                <Link
                  href={`/tours/${otherTour.id}`}
                  className="group/link inline-flex flex-shrink-0 items-center rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 transition-all hover:bg-neutral-200 active:scale-[0.98]"
                >
                  <span>Detaylar</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1.5 transform group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
