'use client';

import {
  searchToursClient,
  tryGetTourDateAgeRanges,
  tryGetTourDetailBundle,
} from '@/services/catalog';
import { getPublicApiBaseUrl } from '@/services/api-client';
import { dedupeTourDatesByRange } from '@/lib/dedupe-tour-dates';
import { resolveMediaUrl } from '@/lib/media';
import { notFound } from 'next/navigation';
import { parseJsonString } from '@/lib/format';
import type { ActivityDate as BookingActivityDate } from '@/components/booking/bottom-booking-bar';
import type { OperatorReview } from '@/components/features/tour-operator/OperatorReviewsSection';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  buildFallbackItinerary,
  getDestinationLabel,
  sanitizePlainText,
} from './tour-detail/tour-detail.helpers';
import {
  TourDetailUiProvider,
  type TourDetailUiContextValue,
} from './tour-detail/tour-detail-context';
import { TourDetailHero } from './tour-detail/tour-detail-hero';
import { TourDetailLeftColumn } from './tour-detail/tour-detail-left-column';
import { TourDetailSidebar } from './tour-detail/tour-detail-sidebar';
import { TourDetailChrome } from './tour-detail/tour-detail-chrome';
import { TourDetailSkeleton } from './tour-detail/tour-detail-skeleton';
import type {
  Destination,
  ItineraryItem,
  Tour,
  TourDate,
  TourDestination,
  TourOperator,
} from './tour-detail/tour-detail.types';

export default function TourDetailClient() {
  const params = useParams();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDate | null>(
    null,
  );
  const [showDateSelectionHint, setShowDateSelectionHint] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickupSliderRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<Tour | null>(null);
  tourRef.current = tour;
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [tourOperator, setTourOperator] = useState<TourOperator | null>(null);
  const [otherTours, setOtherTours] = useState<Tour[]>([]);

  const scrollPickupSlider = (direction: 'prev' | 'next') => {
    const el = pickupSliderRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-pickup-slide]');
    const amount = firstCard
      ? firstCard.offsetWidth + 16
      : Math.min(320, el.clientWidth * 0.9);
    el.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const rawId = params.id;
    const tourId = Array.isArray(rawId)
      ? String(rawId[0] ?? '')
      : String(rawId ?? '');
    if (!tourId) return;

    const abortController = new AbortController();
    let cancelled = false;

    const mapPricingType = (
      type: string | undefined,
    ): 'free' | 'half' | 'percentage' | 'fixed' => {
      const normalized = (type ?? '').toLowerCase();
      if (normalized === 'free') return 'free';
      if (normalized === 'half') return 'half';
      if (normalized === 'percentage') return 'percentage';
      if (normalized === 'fixed') return 'fixed';
      return 'fixed';
    };

    const toItineraryRecord = (value: unknown): Record<string, unknown> => {
      if (!value) return {};
      if (Array.isArray(value)) {
        return Object.fromEntries(
          value.map((item, index) => {
            if (typeof item === 'string') {
              return [
                `day${index}`,
                { title: `${index + 1}. Gün`, description: item },
              ];
            }
            if (item && typeof item === 'object') {
              const row = item as Record<string, unknown>;
              return [
                `day${index}`,
                {
                  title: String(row.title ?? `${index + 1}. Gün`),
                  description: String(row.description ?? ''),
                  highlights: Array.isArray(row.highlights)
                    ? row.highlights
                    : [],
                  schedule: Array.isArray(row.schedule) ? row.schedule : [],
                },
              ];
            }
            return [
              `day${index}`,
              { title: `${index + 1}. Gün`, description: '' },
            ];
          }),
        );
      }
      if (typeof value === 'object') return value as Record<string, unknown>;
      return {};
    };

    const fetchTour = async () => {
      try {
        const hasCachedTour = tourRef.current?.id === tourId;
        if (!hasCachedTour) {
          setLoading(true);
        }
        setError(null);

        const loadCore = async () =>
          tryGetTourDetailBundle(tourId, abortController.signal);

        let [tourPayload, dates, accommodation, pickupPoints] =
          await loadCore();

        // Geri tuşu / kısa süreli ağ kopması: bir kez yeniden dene
        if (!tourPayload && !cancelled && !abortController.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          if (!cancelled && !abortController.signal.aborted) {
            [tourPayload, dates, accommodation, pickupPoints] =
              await loadCore();
          }
        }

        if (cancelled || abortController.signal.aborted) return;

        if (!tourPayload) {
          // Önceki başarılı turu bozma (bfcache / race)
          if (tourRef.current?.id === tourId) {
            setError(null);
            return;
          }
          throw new Error(
            `Tur detayları alınamadı (id: ${tourId}). API çalışıyor mu? (${getPublicApiBaseUrl()})`,
          );
        }

        // Nest Tour + extras → legacy detail shape
        const data = tourPayload as unknown as Record<string, unknown>;

        const extras =
          data.extras &&
          typeof data.extras === 'object' &&
          !Array.isArray(data.extras)
            ? (data.extras as Record<string, unknown>)
            : {};

        const coverUrl = resolveMediaUrl(
          typeof data.coverUrl === 'string' ? data.coverUrl : null,
        );
        const galleryUrls = Array.isArray(data.galleryUrls)
          ? (data.galleryUrls as string[])
              .map((url) => resolveMediaUrl(url))
              .filter((url): url is string => Boolean(url))
          : [];
        const images = [
          ...(coverUrl ? [coverUrl] : []),
          ...galleryUrls.filter((url) => url !== coverUrl),
        ];

        const basePrice = Number(data.price ?? 0);
        const dateRows = Array.isArray(dates) ? dates : [];

        const tourDates: TourDate[] = await Promise.all(
          dateRows.map(async (date) => {
            const ageRangesRaw = await tryGetTourDateAgeRanges(
              tourId,
              date.id,
              abortController.signal,
            );

            return {
              id: date.id,
              startDate: new Date(date.startDate),
              endDate: new Date(date.endDate),
              price:
                date.priceOverride != null
                  ? Number(date.priceOverride)
                  : basePrice,
              availableSeats: date.remainingCapacity ?? date.capacity ?? 0,
              ageRanges: (ageRangesRaw ?? []).map((range) => ({
                id: range.id,
                minAge: range.minAge,
                maxAge: range.maxAge,
                pricingType: mapPricingType(range.pricingType),
                value: Number(range.value ?? 0),
              })),
            };
          }),
        );

        if (cancelled || abortController.signal.aborted) return;

        const destinationsRaw = extras.destinations ?? data.destinations ?? [];
        const destinations: TourDestination[] = Array.isArray(destinationsRaw)
          ? destinationsRaw.map((item) => {
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object' && 'city' in item) {
                return {
                  city: String((item as Destination).city ?? ''),
                  description: String((item as Destination).description ?? ''),
                };
              }
              return String(item);
            })
          : [];

        // Seed / boş extras: başlıktan destinasyon çıkar (Ankara — Kapadokya)
        if (destinations.length === 0) {
          const title = String(data.title ?? '');
          const parts = title
            .split(/—|–|-/)
            .map((part) => part.trim())
            .filter(Boolean);
          for (const part of parts.slice(0, 2)) {
            destinations.push({ city: part, description: '' });
          }
        }

        const departureCityRaw =
          extras.departureCity ?? data.departureCity ?? null;
        const departureCity = Array.isArray(departureCityRaw)
          ? departureCityRaw
              .filter((v): v is string => typeof v === 'string')
              .join(', ')
          : typeof departureCityRaw === 'string'
            ? departureCityRaw
            : destinations[0]
              ? getDestinationLabel(destinations[0])
              : null;

        const durationDays = Number(data.durationDays ?? data.duration ?? 1);
        let itinerary = toItineraryRecord(extras.itinerary ?? data.itinerary);
        if (Object.keys(itinerary).length === 0) {
          itinerary = buildFallbackItinerary(
            durationDays,
            destinations.map(getDestinationLabel),
          );
        }

        const partnerId = String(data.partnerId ?? '');
        const partnerPayload =
          data.partner && typeof data.partner === 'object'
            ? (data.partner as {
                id?: string;
                companyName?: string;
                logo?: string | null;
                membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD';
                averageRating?: string | number;
                reviewCount?: number;
              })
            : null;
        const partnerName = sanitizePlainText(
          partnerPayload?.companyName ||
            (partnerId === 'seed-partner-demo'
              ? 'Demo Tur & Aktivite'
              : 'Tur Operatörü'),
        );
        const partnerTier =
          partnerPayload?.membershipTier ||
          (partnerId === 'seed-partner-demo' ? 'SILVER' : null);

        const transformedTour: Tour = {
          id: String(data.id),
          name: sanitizePlainText(String(data.title ?? data.name ?? '')),
          description: sanitizePlainText(String(data.description ?? '')),
          duration: durationDays,
          price: basePrice,
          discount: Number(extras.discount ?? data.discount ?? 0) || null,
          startDate: extras.startDate
            ? new Date(String(extras.startDate))
            : null,
          endDate: extras.endDate ? new Date(String(extras.endDate)) : null,
          maxParticipants:
            extras.maxParticipants != null
              ? Number(extras.maxParticipants)
              : 20,
          destinations,
          inclusions: Array.isArray(extras.includes)
            ? (extras.includes as string[])
            : Array.isArray(extras.inclusions)
              ? (extras.inclusions as string[])
              : [
                  'Profesyonel tur rehberi',
                  'Ulaşım (belirtilen kalkış noktalarından)',
                  'Konaklama (program dahilse)',
                ],
          exclusions: Array.isArray(extras.excludes)
            ? (extras.excludes as string[])
            : Array.isArray(extras.exclusions)
              ? (extras.exclusions as string[])
              : [
                  'Kişisel harcamalar',
                  'Öğle / akşam yemekleri (belirtilmedikçe)',
                ],
          healthPrivileges: Array.isArray(extras.healthPrivileges)
            ? (extras.healthPrivileges as string[]).filter(
                (item) => typeof item === 'string' && item.trim().length > 0,
              )
            : [],
          itinerary,
          images,
          featured: Boolean(data.featured),
          departureCity,
          region:
            typeof extras.region === 'string'
              ? extras.region
              : typeof data.region === 'string'
                ? data.region
                : null,
          transportation:
            typeof extras.transportation === 'string'
              ? extras.transportation
              : 'Otobüs',
          period: typeof extras.period === 'string' ? extras.period : null,
          rating: Number(data.averageRating ?? data.rating ?? 0) || null,
          tourType:
            typeof extras.tourType === 'string'
              ? extras.tourType
              : typeof data.category === 'string'
                ? data.category
                : null,
          accommodationType:
            typeof extras.accommodationType === 'string'
              ? extras.accommodationType
              : null,
          difficultyLevel:
            typeof extras.difficultyLevel === 'string'
              ? extras.difficultyLevel
              : null,
          ageRestriction:
            extras.ageRestriction != null
              ? Number(extras.ageRestriction)
              : null,
          isPopular: Boolean(extras.isPopular ?? data.featured),
          isLastMinute: Boolean(extras.isLastMinute),
          isEarlyBird: Boolean(extras.isEarlyBird),
          languages: Array.isArray(extras.languages)
            ? (extras.languages as string[])
            : ['Türkçe'],
          tags: Array.isArray(extras.tags) ? (extras.tags as string[]) : [],
          createdAt: new Date(String(data.createdAt ?? Date.now())),
          updatedAt: new Date(String(data.updatedAt ?? Date.now())),
          tourOperatorId: partnerId,
          tourOperator: {
            id: partnerPayload?.id || partnerId,
            companyName: partnerName,
            logo: partnerPayload?.logo ?? null,
            description:
              sanitizePlainText(
                partnerId === 'seed-partner-demo'
                  ? 'Demo partner hesabı — tur ve aktivite yönetimi için örnek operatör.'
                  : typeof (partnerPayload as { description?: string } | null)
                        ?.description === 'string'
                    ? (partnerPayload as { description?: string }).description
                    : null,
              ) || null,
            membershipTier: partnerTier,
            rating: Number(partnerPayload?.averageRating ?? 0) || 5,
            reviewCount:
              partnerPayload?.reviewCount != null
                ? Number(partnerPayload.reviewCount)
                : partnerId === 'seed-partner-demo'
                  ? 2
                  : 0,
          },
          tourDates,
          accommodation: accommodation
            ? {
                name: accommodation.name,
                image: accommodation.image,
                location: accommodation.location,
                type: accommodation.type,
                rating: Number(accommodation.rating ?? 0),
                features: Array.isArray(accommodation.features)
                  ? accommodation.features
                  : [],
              }
            : {
                name:
                  typeof extras.accommodationName === 'string'
                    ? extras.accommodationName
                    : '',
                image: images[0] || '',
                location: '',
                type:
                  typeof extras.accommodationType === 'string'
                    ? extras.accommodationType
                    : '',
                rating: 0,
                features: [],
              },
          meetingPoint:
            typeof extras.meetingPoint === 'string'
              ? extras.meetingPoint
              : undefined,
          meetingTime:
            typeof extras.meetingTime === 'string'
              ? extras.meetingTime
              : undefined,
          pickupPoints: (pickupPoints ?? []).map((point, index) => ({
            id: point.id,
            city: point.city,
            location: point.location,
            description: point.description ?? undefined,
            time: point.time,
            isActive: point.isActive ?? true,
            order: point.order ?? index,
          })),
        };

        if (cancelled || abortController.signal.aborted) return;

        setTour(transformedTour);
        setTourOperator(transformedTour.tourOperator);
        setError(null);
      } catch (err) {
        if (cancelled || abortController.signal.aborted) return;
        console.error('Tur detayları alınırken hata:', err);
        if (tourRef.current?.id === tourId) {
          // Aynı tur zaten ekranda — geri dönüş race'inde notFound gösterme
          setError(null);
          return;
        }
        setTour(null);
        setError('Tur detayları alınamadı');
      } finally {
        if (!cancelled && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchTour();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollPosition + windowHeight > documentHeight - 600) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const operatorId = tour?.tourOperator?.id;
    if (!operatorId) {
      return;
    }

    const fetchOtherTours = async () => {
      try {
        const { data: rows } = await searchToursClient({
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (!Array.isArray(rows)) return;
        const mapped = rows
          .filter(
            (row) =>
              row.id !== tour?.id &&
              ((row as { partnerId?: string; agencyId?: string }).partnerId ===
                operatorId ||
                (row as { partnerId?: string; agencyId?: string }).agencyId ===
                  operatorId),
          )
          .slice(0, 4)
          .map((row) => {
            const record = row as unknown as Record<string, unknown>;
            const cover =
              (typeof record.coverUrl === 'string' && record.coverUrl
                ? resolveMediaUrl(record.coverUrl)
                : null) ?? '/brand/mark-on-light.png';
            return {
              id: String(record.id),
              name: String(record.title ?? ''),
              description: String(record.description ?? ''),
              duration: Number(record.durationDays ?? 1),
              price: Number(record.price ?? 0),
              discount: null,
              startDate: null,
              endDate: null,
              maxParticipants: null,
              destinations: [] as TourDestination[],
              inclusions: [],
              exclusions: [],
              healthPrivileges: [],
              itinerary: {},
              images: [cover],
              featured: Boolean(record.featured),
              departureCity: null,
              region: null,
              transportation: null,
              period: null,
              rating: Number(record.averageRating ?? 0) || null,
              tourType:
                typeof record.category === 'string' ? record.category : null,
              accommodationType: null,
              difficultyLevel: null,
              ageRestriction: null,
              isPopular: false,
              isLastMinute: false,
              isEarlyBird: false,
              languages: [],
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              tourOperatorId: operatorId,
              tourOperator: tour!.tourOperator,
              tourDates: [],
              accommodation: {
                name: '',
                image: '',
                location: '',
                type: '',
                rating: 0,
                features: [],
              },
            } satisfies Tour;
          });
        setOtherTours(mapped);
      } catch (err) {
        console.error('Turlar yüklenirken hata:', err);
      }
    };

    void fetchOtherTours();
  }, [tour?.tourOperator?.id, tour?.id, tour?.tourOperator]);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const availableTourDates = useMemo(() => {
    if (!tour?.tourDates) return [];
    const upcoming = tour.tourDates.filter(
      (date) => new Date(date.startDate) >= today,
    );
    // Belt-and-suspenders while API quiet-dedupe rolls out / caches warm.
    return dedupeTourDatesByRange(upcoming);
  }, [tour?.tourDates, today]);

  const handleDateSelect = (date: TourDate | BookingActivityDate | null) => {
    // This page only mounts BottomBookingBar with `tour` (not activity).
    const tourDate = date as TourDate | null;
    setSelectedTourDate(tourDate);
    if (tourDate) {
      setShowDateSelectionHint(false);
      setExpanded(true);
    }
  };

  const promptDateSelection = () => {
    if (!selectedTourDate) {
      setShowDateSelectionHint(true);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#booking') {
        promptDateSelection();
      }
    };

    if (window.location.hash === '#booking') {
      promptDateSelection();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedTourDate]);

  const handleParticipantsChange = (_participants: {
    [key: string]: number;
  }) => {
    void _participants;
    // Counts stay in BottomBookingBar; checkout uses dateId + adults/children query.
  };

  if (loading) {
    return <TourDetailSkeleton />;
  }

  if (error || !tour) {
    return notFound();
  }

  // Tur dahil olanlar ve olmayanlar
  const inclusions = parseJsonString<string[]>(tour.inclusions ?? [], []);
  const exclusions = parseJsonString<string[]>(tour.exclusions ?? [], []);
  const healthPrivileges = Array.isArray(tour.healthPrivileges)
    ? tour.healthPrivileges.filter(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
    : [];

  // Tur destinasyonları
  const getDestinationName = (d: TourDestination): string =>
    getDestinationLabel(d);

  const tourReviews: OperatorReview[] = (tourOperator?.reviews || []).filter(
    (review) => review.booking.tour?.id === tour.id,
  );
  const tourReviewCount = tourReviews.length;
  const tourAverageRating =
    tourReviewCount > 0
      ? tourReviews.reduce((sum, review) => sum + review.rating, 0) /
        tourReviewCount
      : 0;

  const destinations = Array.isArray(tour.destinations)
    ? tour.destinations.map(getDestinationName).filter(Boolean)
    : parseJsonString<Destination[]>(tour.destinations, []).map((d) => d.city);

  const galleryImages = Array.isArray(tour.images) ? tour.images : [];
  const activePickupPoints = (tour.pickupPoints ?? [])
    .filter((point) => point.isActive !== false)
    .sort((a, b) => a.order - b.order);
  const pickupSlideCount =
    (tour.meetingPoint ? 1 : 0) +
    (activePickupPoints.length > 0
      ? activePickupPoints.length
      : tour.meetingPoint
        ? 0
        : 1);
  const pickupSlideClass =
    pickupSlideCount > 1
      ? 'w-[min(100%,240px)] shrink-0 snap-start sm:w-[min(100%,260px)]'
      : 'w-full shrink-0 snap-start';

  // Tur programını parse et — boş {} fallback'i boş say
  const itinerary = (() => {
    const itinerarySource: string | Record<string, ItineraryItem> =
      typeof tour.itinerary === 'string'
        ? tour.itinerary
        : tour.itinerary && typeof tour.itinerary === 'object'
          ? (tour.itinerary as Record<string, ItineraryItem>)
          : '{}';
    const parsed = parseJsonString<Record<string, ItineraryItem>>(
      itinerarySource,
      {},
    );
    return parsed && typeof parsed === 'object' ? parsed : {};
  })();

  const displayRating =
    tourReviewCount > 0
      ? tourAverageRating
      : (tour.rating ?? tourOperator?.rating ?? 0);
  const displayReviewCount =
    tourReviewCount > 0 ? tourReviewCount : (tourOperator?.reviewCount ?? 0);
  const nights = Math.max(tour.duration - 1, 0);

  const ui: TourDetailUiContextValue = {
    tour,
    tourOperator,
    otherTours,
    availableTourDates,
    selectedTourDate,
    showDateSelectionHint,
    expanded,
    setExpanded,
    showScrollIndicator,
    inclusions,
    exclusions,
    healthPrivileges,
    destinations,
    galleryImages,
    activePickupPoints,
    pickupSlideCount,
    pickupSlideClass,
    pickupSliderRef,
    containerRef,
    scrollPickupSlider,
    itinerary,
    tourReviews,
    tourReviewCount,
    tourAverageRating,
    displayRating,
    displayReviewCount,
    nights,
    promptDateSelection,
    handleDateSelect,
    handleParticipantsChange,
  };

  return (
    <TourDetailUiProvider value={ui}>
      <div className="overflow-x-hidden bg-gray-50 pb-28 md:pb-0">
        <TourDetailHero />

        <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
          <div className="mb-12 grid grid-cols-1 items-start gap-8 md:mb-16 lg:grid-cols-3 lg:gap-10 xl:gap-12">
            <div className="min-w-0 lg:col-span-2">
              <TourDetailLeftColumn />
            </div>
            <TourDetailSidebar />
          </div>
        </div>

        <TourDetailChrome />
      </div>
    </TourDetailUiProvider>
  );
}
