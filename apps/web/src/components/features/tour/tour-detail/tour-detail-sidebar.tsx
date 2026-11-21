'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle as ExclamationCircleIcon,
  ArrowRight as ArrowRightIcon,
  Building2 as BuildingOfficeIcon,
  CalendarDays as CalendarDaysIcon,
  MessageCircle as ChatBubbleLeftRightIcon,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react';
import MembershipBadge from '@/components/features/tour/membership-badge';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { formatPriceTry, sanitizePlainText } from './tour-detail.helpers';
import { useTourDetailUi } from './tour-detail-context';
import { renderStars } from './render-stars';

/** Sticky rezervasyon + kompakt operatör kartı. */
export function TourDetailSidebar() {
  const {
    tour,
    tourOperator,
    availableTourDates,
    selectedTourDate,
    showDateSelectionHint,
    healthPrivileges,
    handleDateSelect,
    promptDateSelection,
    setExpanded,
  } = useTourDetailUi();

  const operatorLogoUrl = tourOperator
    ? resolveMediaUrl(tourOperator.logo) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(tourOperator.companyName || 'Operator')}&background=0EA5E9&color=fff`
    : '';

  const displayUnitPrice =
    selectedTourDate?.price != null ? selectedTourDate.price : tour.price;

  return (
    <aside
      className="w-full min-w-0 lg:col-span-1 lg:h-full"
      data-testid="tour-detail-sidebar"
    >
      <div
        className="flex w-full min-w-0 flex-col space-y-6 self-start lg:sticky lg:top-24"
        data-testid="tour-detail-sidebar-sticky"
      >
        <div
          id="booking"
          className="w-full min-w-0 scroll-mt-28 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-md sm:p-5"
        >
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex min-w-0 items-center text-xl font-semibold text-neutral-950">
                <CalendarDaysIcon className="mr-2 h-5 w-5 flex-shrink-0" />
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

          <div className="relative group">
            {showDateSelectionHint ? (
              <div
                className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full"
                role="tooltip"
              >
                <div className="relative whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-md animate-bounce-subtle">
                  Tarih seçmek için kartlara tıklayın
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-600" />
                </div>
              </div>
            ) : null}
            <div
              className={`mb-0 rounded-xl bg-neutral-50/60 p-3 transition-all duration-300 sm:p-4 ${
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
                        className={`flex w-full min-w-0 flex-col gap-2 rounded-xl border bg-white p-3 text-left transition-all duration-150 ease-out hover:shadow-sm active:scale-[0.99] ${
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

          <button
            type="button"
            data-testid="tour-detail-reserve-cta"
            onClick={() => {
              if (selectedTourDate) {
                setExpanded(true);
                return;
              }
              promptDateSelection();
              document
                .getElementById('booking')
                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            Rezervasyon Yap
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>

        {tourOperator ? (
          <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-md sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex min-w-0 items-center text-base font-semibold text-neutral-950">
                <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5 shrink-0" />
                <span className="truncate">Tur Operatörü</span>
              </h2>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md">
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
                  <h4 className="truncate text-sm font-semibold text-neutral-900">
                    {sanitizePlainText(tourOperator.companyName)}
                  </h4>
                  {tourOperator.membershipTier ? (
                    <MembershipBadge tier={tourOperator.membershipTier} />
                  ) : null}
                </div>
                {(tourOperator.reviewCount ?? 0) > 0 ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                    <span className="inline-flex text-amber-400">
                      {renderStars(tourOperator.rating ?? 0, 'sm')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <span>{(tourOperator.rating ?? 0).toFixed(1)}</span>
                      <span className="text-neutral-400" aria-hidden>
                        ·
                      </span>
                      <span>{tourOperator.reviewCount} değerlendirme</span>
                    </span>
                  </div>
                ) : null}
                <Link
                  href={`/tour-operator/${tourOperator.id}#tours`}
                  className="mt-1 inline-flex items-center text-sm font-medium text-neutral-950 hover:text-neutral-700"
                >
                  Tüm turları gör
                  <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="w-full min-w-0 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-sm"
          data-testid="tour-detail-trust-box"
        >
          <h3 className="mb-2.5 flex items-center text-sm font-semibold text-emerald-950">
            <ShieldCheckIcon className="mr-2 h-4 w-4 shrink-0 text-emerald-700" />
            Turta Güvencesi
          </h3>
          <ul className="space-y-1.5 text-xs text-emerald-950/80 sm:text-[13px]">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>Doğrulanmış Tur Operatörü</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>Güvenli Ödeme Altyapısı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>7/24 Yolcu Desteği</span>
            </li>
          </ul>
        </div>

        {healthPrivileges.length > 0 ? (
          <div className="w-full overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/50 p-4 shadow-sm">
            <h3 className="mb-2 flex items-center text-sm font-semibold text-sky-900">
              <ShieldCheckIcon className="mr-2 h-4 w-4" />
              Sağlık ayrıcalıkları
            </h3>
            <ul className="space-y-1.5">
              {healthPrivileges.slice(0, 4).map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-xs text-neutral-700"
                >
                  <BuildingOfficeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                  <span className="break-words [overflow-wrap:anywhere]">
                    {sanitizePlainText(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
