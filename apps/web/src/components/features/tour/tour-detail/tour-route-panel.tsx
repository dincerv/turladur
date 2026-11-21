'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  ChevronDown,
  Coffee,
  Moon,
  Sun,
  Utensils,
} from 'lucide-react';
import {
  TourRouteStopKind,
  isValidGeoCoordinate,
} from '@turta/shared-constants';
import {
  normalizeItinerary,
  stripDayPrefixFromTitle,
} from '@/components/features/tour/itinerary/normalize-itinerary';
import { MEAL_STATUS_LABELS, type MealStatus } from '@/lib/tours/itinerary-day';
import { shouldUnoptimizeMedia } from '@/lib/media';

import { TourRouteMap } from './tour-route-map-loader';
import { dayColor, dayColorSoft } from './tour-route-map.helpers';
import { sanitizePlainText } from './tour-detail.helpers';
import { useTourDetailUi } from './tour-detail-context';
import type { ItineraryItem, TourRouteStopView } from './tour-detail.types';

type PickupView = {
  id: string;
  city: string;
  location: string;
  description?: string;
  time: string;
  latitude?: number | null;
  longitude?: number | null;
};

type TourRoutePanelProps = {
  routeStops: TourRouteStopView[];
  pickupPoints: PickupView[];
  itinerary?: Record<string, ItineraryItem>;
  regionHints?: Array<string | null | undefined>;
  /** Çok günlü turlarda konaklama satırı; 1 gün / DAY_TRIP ise gizlenir. */
  showAccommodation?: boolean;
  durationDays?: number;
};

type MapTab = 'route' | 'boarding';

function mealLabel(status: MealStatus | null | undefined): string | null {
  if (!status) return null;
  return MEAL_STATUS_LABELS[status];
}

export function TourRoutePanel({
  routeStops,
  pickupPoints,
  itinerary,
  regionHints = [],
  showAccommodation = true,
  durationDays,
}: TourRoutePanelProps) {
  const { openGalleryAt } = useTourDetailUi();
  const [tab, setTab] = useState<MapTab>('route');
  const [dayFilter, setDayFilter] = useState<'all' | number>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    () => new Set([1, 2]),
  );

  const geoStops = useMemo(
    () =>
      routeStops.filter((s) => isValidGeoCoordinate(s.latitude, s.longitude)),
    [routeStops],
  );
  const hasGeoRoute = geoStops.length > 0;

  const normalizedDays = useMemo(
    () => normalizeItinerary(itinerary),
    [itinerary],
  );

  const programDays = useMemo(() => {
    const fromStops = [...new Set(routeStops.map((s) => s.dayNumber))];
    const fromItin = normalizedDays.map((d) => d.dayNumber);
    const maxDuration = Math.max(
      durationDays ?? 0,
      ...fromStops,
      ...fromItin,
      1,
    );
    const days: number[] = [];
    for (let d = 1; d <= maxDuration; d += 1) days.push(d);
    // If we only have itinerary sparse keys, still show those days
    if (normalizedDays.length > 0 && (!durationDays || durationDays < 1)) {
      return [...new Set([...fromItin, ...fromStops])].sort((a, b) => a - b);
    }
    return days;
  }, [durationDays, normalizedDays, routeStops]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => {
      setIsMdUp(mq.matches);
      if (mq.matches) setMobileMapOpen(false);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setExpandedDays(new Set(programDays.filter((d) => d <= 2)));
  }, [programDays]);

  const daysWithStops = useMemo(
    () =>
      [...new Set(geoStops.map((stop) => stop.dayNumber))].sort(
        (a, b) => a - b,
      ),
    [geoStops],
  );

  const filteredStops = useMemo(() => {
    const base =
      dayFilter === 'all'
        ? geoStops
        : geoStops.filter((stop) => stop.dayNumber === dayFilter);
    return [...base].sort(
      (a, b) => a.order - b.order || a.dayNumber - b.dayNumber,
    );
  }, [dayFilter, geoStops]);

  const sequenceById = useMemo(() => {
    const map = new Map<string, number>();
    [...geoStops]
      .sort((a, b) => a.dayNumber - b.dayNumber || a.order - b.order)
      .forEach((stop, index) => map.set(stop.id, index + 1));
    return map;
  }, [geoStops]);

  const stopsByDay = useMemo(() => {
    const map = new Map<number, TourRouteStopView[]>();
    for (const stop of geoStops) {
      const list = map.get(stop.dayNumber) ?? [];
      list.push(stop);
      map.set(stop.dayNumber, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [geoStops]);

  const boardingAsStops: TourRouteStopView[] = useMemo(
    () =>
      pickupPoints
        .filter((p) => isValidGeoCoordinate(p.latitude, p.longitude))
        .map((p, index) => ({
          id: p.id,
          dayNumber: 1,
          order: index,
          name: `${p.city} — ${p.location}`,
          description: p.description ?? `Toplanma: ${p.time}`,
          latitude: p.latitude as number,
          longitude: p.longitude as number,
          kind: TourRouteStopKind.VISIT,
        })),
    [pickupPoints],
  );

  const mapStops = tab === 'route' ? filteredStops : boardingAsStops;

  function dayMeta(dayNumber: number) {
    const item = normalizedDays.find((d) => d.dayNumber === dayNumber) ?? null;
    const rawTitle = item?.title?.trim() || `${dayNumber}. Gün`;
    const title =
      stripDayPrefixFromTitle(rawTitle, dayNumber) || `${dayNumber}. Gün`;
    return {
      title,
      description: item?.description ? sanitizePlainText(item.description) : '',
      highlights: item?.highlights ?? [],
      meals: item?.meals,
      accommodation: item?.accommodation?.trim() || '',
      imageUrls: item?.imageUrls ?? [],
    };
  }

  function toggleDay(day: number) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function expandAll(open: boolean) {
    setExpandedDays(open ? new Set(programDays) : new Set());
  }

  function focusStop(stopId: string, dayNumber: number) {
    setTab('route');
    setDayFilter(dayNumber);
    setSelectedStopId(stopId);
    setExpandedDays((prev) => new Set(prev).add(dayNumber));
    if (!isMdUp) setMobileMapOpen(true);
  }

  const allExpanded = programDays.every((d) => expandedDays.has(d));

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm"
      data-testid="tour-route-panel"
    >
      {hasGeoRoute || boardingAsStops.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-neutral-200 px-4 py-3 sm:px-5">
            <div
              className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1"
              role="tablist"
              aria-label="Harita görünümü"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'route'}
                data-testid="tour-route-tab-route"
                disabled={!hasGeoRoute}
                onClick={() => {
                  setTab('route');
                  setSelectedStopId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
                  tab === 'route'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600'
                }`}
              >
                Tur Rotası
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'boarding'}
                data-testid="tour-route-tab-boarding"
                onClick={() => {
                  setTab('boarding');
                  setSelectedStopId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  tab === 'boarding'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600'
                }`}
              >
                Biniş Noktaları
              </button>
            </div>

            {tab === 'route' && daysWithStops.length > 0 ? (
              <div
                className="flex flex-wrap items-center gap-1.5"
                data-testid="tour-route-day-filters"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDayFilter('all');
                    setSelectedStopId(null);
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    dayFilter === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  Tümü
                </button>
                {daysWithStops.map((day) => {
                  const selected = dayFilter === day;
                  const accent = dayColor(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setDayFilter(day);
                        setSelectedStopId(null);
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        selected
                          ? 'text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                      style={
                        selected
                          ? { backgroundColor: accent }
                          : { boxShadow: `inset 0 0 0 1.5px ${accent}33` }
                      }
                    >
                      {day}. Gün
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {tab === 'route' && hasGeoRoute ? (
            <>
              <div className="border-b border-neutral-200 px-4 py-3 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMapOpen((v) => !v)}
                  className="inline-flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800"
                  data-testid="tour-route-mobile-map-toggle"
                >
                  <span>Haritayı {mobileMapOpen ? 'gizle' : 'göster'}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition ${mobileMapOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileMapOpen ? (
                  <div className="mt-3">
                    <TourRouteMap
                      stops={mapStops}
                      selectedStopId={selectedStopId}
                      onSelectStop={setSelectedStopId}
                      regionHints={regionHints}
                    />
                  </div>
                ) : null}
              </div>
              <div className="hidden border-b border-neutral-200 p-4 md:block md:p-5">
                {isMdUp ? (
                  <TourRouteMap
                    stops={mapStops}
                    selectedStopId={selectedStopId}
                    onSelectStop={setSelectedStopId}
                    regionHints={regionHints}
                    className="tour-route-map-shell relative z-0 isolate h-72 w-full overflow-hidden rounded-2xl border border-orange-100/80 bg-[#f8f4ec] shadow-inner sm:h-80 lg:h-[26rem]"
                  />
                ) : null}
              </div>
            </>
          ) : tab === 'boarding' ? (
            <div className="space-y-4 border-b border-neutral-200 p-4 sm:p-5">
              {boardingAsStops.length > 0 ? (
                <TourRouteMap
                  stops={boardingAsStops}
                  selectedStopId={selectedStopId}
                  onSelectStop={setSelectedStopId}
                  regionHints={regionHints}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-8 text-center text-sm text-neutral-500">
                  Biniş noktaları için konum bilgisi henüz eklenmemiş.
                </p>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {pickupPoints.map((point, index) => (
                  <li
                    key={point.id}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {index + 1}. {point.city} — {point.location}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      Toplanma: {point.time}
                      {point.description ? ` · ${point.description}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      <div
        className="px-4 py-4 sm:px-5 sm:py-5"
        data-testid="tour-itinerary-days"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-neutral-900 sm:text-base">
            Tur Programı ve Rotası
          </h4>
          {programDays.length > 2 ? (
            <button
              type="button"
              data-testid="tour-itinerary-toggle-all"
              onClick={() => expandAll(!allExpanded)}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-950"
            >
              {allExpanded ? 'Tüm Günleri Kapat' : 'Tüm Günleri Aç'}
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {programDays.map((day) => {
            const meta = dayMeta(day);
            const accent = dayColor(day);
            const open = expandedDays.has(day);
            const dayStops = stopsByDay.get(day) ?? [];
            return (
              <div
                key={`itin-day-${day}`}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                data-testid={`tour-itinerary-day-${day}`}
                data-expanded={open ? 'true' : 'false'}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left sm:px-4"
                  aria-expanded={open}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: accent }}
                  >
                    {day}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-neutral-900">
                      {day}. Gün
                      {meta.title && meta.title !== `${day}. Gün`
                        ? ` — ${meta.title}`
                        : ''}
                    </span>
                    {!open && meta.description ? (
                      <span className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
                        {meta.description}
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-500 transition ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open ? (
                  <div className="space-y-3 border-t border-neutral-100 px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
                    {meta.description ? (
                      <p className="whitespace-pre-line text-base leading-relaxed text-neutral-700">
                        {meta.description}
                      </p>
                    ) : (
                      <p className="text-base text-neutral-500">
                        Bu gün için detaylı program metni henüz eklenmemiş.
                      </p>
                    )}

                    {meta.imageUrls.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-2"
                        data-testid={`tour-itinerary-day-${day}-images`}
                      >
                        {meta.imageUrls.map((url) => (
                          <button
                            key={`${day}-${url}`}
                            type="button"
                            onClick={() => openGalleryAt(url)}
                            className="relative h-16 w-24 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-sm transition hover:ring-2 hover:ring-neutral-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                            aria-label={`${day}. gün fotoğrafı`}
                          >
                            <Image
                              src={url}
                              alt=""
                              fill
                              sizes="96px"
                              unoptimized={shouldUnoptimizeMedia(url)}
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {meta.highlights.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {meta.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {dayStops.length > 0 ? (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Ziyaret durakları
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {dayStops.map((stop) => {
                            const seq = sequenceById.get(stop.id) ?? 1;
                            const active = selectedStopId === stop.id;
                            const lodging =
                              stop.kind === TourRouteStopKind.LODGING;
                            return (
                              <button
                                key={stop.id}
                                type="button"
                                data-testid={`tour-itinerary-stop-chip-${stop.id}`}
                                onClick={() => focusStop(stop.id, day)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                  active
                                    ? 'text-white shadow-sm'
                                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-orange-200'
                                }`}
                                style={
                                  active
                                    ? {
                                        backgroundColor: accent,
                                        borderColor: accent,
                                      }
                                    : {
                                        boxShadow: `inset 0 0 0 1px ${dayColorSoft(day, 0.5)}`,
                                      }
                                }
                              >
                                <span
                                  className={`flex h-5 w-5 items-center justify-center text-[10px] font-bold ${
                                    lodging ? 'rounded-md' : 'rounded-full'
                                  } ${active ? 'bg-white/20 text-white' : 'text-white'}`}
                                  style={
                                    active
                                      ? undefined
                                      : { backgroundColor: accent }
                                  }
                                >
                                  {lodging ? (
                                    <BedDouble className="h-3 w-3" />
                                  ) : (
                                    seq
                                  )}
                                </span>
                                {stop.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {(() => {
                      const breakfast = mealLabel(
                        meta.meals?.breakfast ?? null,
                      );
                      const lunch = mealLabel(meta.meals?.lunch ?? null);
                      const dinner = mealLabel(meta.meals?.dinner ?? null);
                      const lodging =
                        showAccommodation && meta.accommodation
                          ? meta.accommodation
                          : null;
                      if (!breakfast && !lunch && !dinner && !lodging) {
                        return null;
                      }
                      return (
                        <div
                          className="flex flex-wrap gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-xs text-neutral-700"
                          data-testid={`tour-itinerary-day-${day}-logistics`}
                        >
                          {breakfast ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Coffee className="h-3.5 w-3.5 text-amber-700" />
                              <span className="font-medium">
                                Kahvaltı:
                              </span>{' '}
                              {breakfast}
                            </span>
                          ) : null}
                          {lunch ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Sun className="h-3.5 w-3.5 text-orange-600" />
                              <span className="font-medium">Öğle:</span> {lunch}
                            </span>
                          ) : null}
                          {dinner ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Utensils className="h-3.5 w-3.5 text-rose-600" />
                              <span className="font-medium">Akşam:</span>{' '}
                              {dinner}
                            </span>
                          ) : null}
                          {lodging ? (
                            <span className="inline-flex min-w-0 items-center gap-1.5 sm:ml-auto">
                              <Moon className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                              <span className="truncate">
                                <span className="font-medium">Konaklama:</span>{' '}
                                {lodging}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
