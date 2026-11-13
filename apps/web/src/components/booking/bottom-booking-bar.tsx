'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  User as UserIcon,
  ArrowRight as ArrowRightIcon,
  CheckCircle as CheckCircleIcon,
  ChevronUp as ChevronUpIcon,
  X as XMarkIcon,
  Calendar as CalendarIcon,
  Info as InformationCircleIcon,
  AlertCircle as ExclamationCircleIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  adultChildToParticipants,
  childSharesAdultRange,
  computeTourPricing,
  findAdultAgeRange,
  findChildAgeRange,
} from '@/lib/booking-utils';
import { dedupeTourDatesByRange } from '@/lib/dedupe-tour-dates';

interface TourDateAgeRange {
  id: string;
  minAge: number;
  maxAge: number | null;
  pricingType: 'free' | 'half' | 'percentage' | 'fixed';
  value: number;
}

interface TourDate {
  id: string;
  startDate: Date;
  endDate: Date;
  price: number;
  availableSeats: number;
  ageRanges: TourDateAgeRange[];
  earlyBirdDiscount?: number;
  earlyBirdDeadline?: string;
  lastMinuteDiscount?: number;
  lastMinuteStart?: string;
  minParticipants?: number;
}

interface Tour {
  id: string;
  name: string;
  price: number;
  discount: number | null;
  tourDates: TourDate[];
}

export interface ActivityDateAgeRange {
  id: string;
  minAge: number;
  maxAge: number | null;
  pricingType: 'free' | 'half' | 'percentage' | 'fixed';
  value: number;
}

export interface ActivityDate {
  id: string;
  startDate: Date;
  endDate: Date;
  price: number;
  availableSeats: number;
  ageRanges?: ActivityDateAgeRange[];
}

interface Activity {
  id: string;
  name: string;
  price: number;
  activityDates: ActivityDate[];
  ageRestriction?: string;
}

interface Props {
  tour?: Tour;
  activity?: Activity;
  onDateSelect?: (date: TourDate | ActivityDate | null) => void;
  onParticipantsChange?: (
    participants: { [key: string]: number } | { total: number },
  ) => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  selectedDate?: TourDate | ActivityDate | null;
  forceVisible?: boolean;
  /** Hide desktop tab/panel — use with sticky sidebar booking UI. */
  mobileOnly?: boolean;
}

/** Legacy UX: even without partner-defined tiers, show Yetişkin / Çocuk counters. */
const DEFAULT_TOUR_AGE_RANGES: TourDateAgeRange[] = [
  {
    id: 'default-child',
    minAge: 0,
    maxAge: 12,
    pricingType: 'half',
    value: 50,
  },
  {
    id: 'default-adult',
    minAge: 18,
    maxAge: null,
    pricingType: 'percentage',
    value: 0,
  },
];

function resolveTourAgeRanges(
  ranges: TourDateAgeRange[] | undefined | null,
): TourDateAgeRange[] {
  if (ranges && ranges.length > 0) return ranges;
  return DEFAULT_TOUR_AGE_RANGES;
}

export default function BottomBookingBar({
  tour,
  activity,
  onDateSelect,
  onParticipantsChange,
  isExpanded = false,
  onExpandedChange,
  selectedDate: initialSelectedDate = null,
  forceVisible = false,
  mobileOnly = false,
}: Props) {
  const [visible, setVisible] = useState(forceVisible);
  const [expanded, setExpanded] = useState(false);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<
    TourDate | ActivityDate | null
  >(initialSelectedDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  // Tour specific state
  const [selectedDateAgeRanges, setSelectedDateAgeRanges] = useState<
    TourDateAgeRange[]
  >([]);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);

  // Activity specific state
  const [activityParticipantCount, setActivityParticipantCount] =
    useState<number>(1);

  const data = useMemo(() => tour || activity, [tour, activity]);
  const entityType = useMemo(() => (tour ? 'tour' : 'activity'), [tour]);
  const dates = useMemo(
    () => (entityType === 'tour' ? tour!.tourDates : activity!.activityDates),
    [tour, activity, entityType],
  );

  useEffect(() => {
    setCurrentSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setExpanded(true);
      }, 50);
      return () => clearTimeout(timer);
    }
    setExpanded(false);
  }, [isExpanded]);

  useEffect(() => {
    if (!expanded) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        onExpandedChange?.(false);
      }
    };
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [expanded]);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }
    const handleScroll = () => {
      const shouldBeVisible = window.scrollY > 400;
      setVisible(shouldBeVisible);
      if (!shouldBeVisible && expanded) {
        setExpanded(false);
        onExpandedChange?.(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expanded, onExpandedChange, forceVisible]);

  const fetchAgeRanges = async (dateId: string) => {
    if (entityType !== 'tour') return;
    try {
      setIsLoading(true);
      setError(null);

      const embedded =
        currentSelectedDate &&
        'ageRanges' in currentSelectedDate &&
        Array.isArray(currentSelectedDate.ageRanges)
          ? (currentSelectedDate.ageRanges as TourDateAgeRange[])
          : [];

      if (embedded.length > 0) {
        setSelectedDateAgeRanges(resolveTourAgeRanges(embedded));
        return;
      }

      if (!tour?.id) {
        setSelectedDateAgeRanges(DEFAULT_TOUR_AGE_RANGES);
        return;
      }

      const { getTourDateAgeRanges } = await import('@/services/catalog');
      const rows = await getTourDateAgeRanges(tour.id, dateId);
      const mapPricingType = (
        type: string | undefined,
      ): TourDateAgeRange['pricingType'] => {
        const normalized = (type ?? '').toLowerCase();
        if (normalized === 'free') return 'free';
        if (normalized === 'half') return 'half';
        if (normalized === 'percentage') return 'percentage';
        return 'fixed';
      };

      setSelectedDateAgeRanges(
        resolveTourAgeRanges(
          rows.map(
            (range: {
              id: string;
              minAge: number;
              maxAge: number | null;
              pricingType: string;
              value: number;
            }) => ({
              id: range.id,
              minAge: range.minAge,
              maxAge: range.maxAge,
              pricingType: mapPricingType(range.pricingType),
              value: Number(range.value ?? 0),
            }),
          ),
        ),
      );
    } catch (err) {
      console.error('Yaş aralıkları yüklenemedi:', { dateId, error: err });
      // Keep counters usable (legacy) even if Nest age-range fetch fails
      setSelectedDateAgeRanges(DEFAULT_TOUR_AGE_RANGES);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSelectedDate && entityType === 'tour') {
      fetchAgeRanges(currentSelectedDate.id);
    } else {
      setSelectedDateAgeRanges([]);
    }
  }, [currentSelectedDate, entityType]);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const tourParticipants = useMemo(
    () =>
      adultChildToParticipants(adultCount, childCount, selectedDateAgeRanges),
    [adultCount, childCount, selectedDateAgeRanges],
  );

  const adultAgeRange = useMemo(
    () => findAdultAgeRange(selectedDateAgeRanges),
    [selectedDateAgeRanges],
  );
  const childAgeRange = useMemo(
    () => findChildAgeRange(selectedDateAgeRanges),
    [selectedDateAgeRanges],
  );
  const childSharesAdultRangeFlag = childSharesAdultRange(
    selectedDateAgeRanges,
  );

  const lastNotifiedParticipantsRef = useRef<string>('');

  useEffect(() => {
    if (entityType !== 'tour' || selectedDateAgeRanges.length === 0) return;
    if (adultCount === 0 && childCount === 0) {
      setAdultCount(1);
      return;
    }

    const serialized = JSON.stringify(tourParticipants);
    if (serialized === lastNotifiedParticipantsRef.current) return;
    lastNotifiedParticipantsRef.current = serialized;
    onParticipantsChange?.(tourParticipants);
  }, [
    entityType,
    selectedDateAgeRanges,
    adultCount,
    childCount,
    tourParticipants,
    onParticipantsChange,
  ]);

  const availableDates = useMemo(() => {
    const upcoming = (dates || []).filter(
      (date) => new Date(date.startDate) >= today,
    );
    return dedupeTourDatesByRange(upcoming);
  }, [dates, today]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for discount badge UI
  const checkDiscounts = useCallback(
    (date: TourDate | ActivityDate) => {
      const hasEarlyBird =
        'earlyBirdDeadline' in date && 'earlyBirdDiscount' in date;
      const hasLastMinute =
        'lastMinuteStart' in date && 'lastMinuteDiscount' in date;
      return {
        hasEarlyBirdDiscount:
          hasEarlyBird &&
          (date as TourDate).earlyBirdDiscount &&
          new Date((date as TourDate).earlyBirdDeadline!) >= today,
        hasLastMinuteDiscount:
          hasLastMinute &&
          (date as TourDate).lastMinuteDiscount &&
          new Date((date as TourDate).lastMinuteStart!) <= today,
      };
    },
    [today],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for age-range price display
  const calculatePriceForRange = (
    basePrice: number,
    range: TourDateAgeRange,
  ) => {
    switch (range.pricingType) {
      case 'free':
        return 0;
      case 'half':
        return basePrice * 0.5;
      case 'percentage':
        return basePrice * (1 - range.value / 100);
      case 'fixed':
        return range.value;
      default:
        return basePrice;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for age-range price display
  const getPriceDisplayText = (
    range: TourDateAgeRange,
    basePrice: number,
    originalPrice: number,
  ) => {
    const hasDiscount = basePrice !== originalPrice;

    switch (range.pricingType) {
      case 'free':
        return 'Ücretsiz';
      case 'half': {
        const finalPrice = basePrice * 0.5;
        return hasDiscount
          ? `%50 İndirimli (${formatPrice(originalPrice * 0.5)} ₺ yerine ${formatPrice(finalPrice)} ₺)`
          : `%50 İndirimli (${formatPrice(finalPrice)} ₺)`;
      }
      case 'percentage': {
        const finalPrice = basePrice * (1 - range.value / 100);
        return hasDiscount
          ? `%${range.value} İndirimli (${formatPrice(originalPrice * (1 - range.value / 100))} ₺ yerine ${formatPrice(finalPrice)} ₺)`
          : `%${range.value} İndirimli (${formatPrice(finalPrice)} ₺)`;
      }
      case 'fixed':
        return hasDiscount
          ? `${formatPrice(originalPrice)} ₺ yerine ${formatPrice(basePrice)} ₺`
          : `${formatPrice(basePrice)} ₺`;
      default:
        return '';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for age-range labels
  function formatAgeRange(minAge: number, maxAge: number | null): string {
    if (maxAge === null) {
      return `${minAge}+`;
    }
    return `${minAge}-${maxAge}`;
  }

  const handleExpandClick = () => {
    if (expanded) {
      setExpanded(false);
      onExpandedChange?.(false);
    } else if (onExpandedChange) {
      onExpandedChange(true);
    } else {
      setExpanded(true);
    }
  };

  const handleDateSelect = (date: TourDate | ActivityDate | null) => {
    setCurrentSelectedDate(date);
    onDateSelect?.(date);
    if (entityType === 'activity') {
      setActivityParticipantCount(1);
      onParticipantsChange?.({ total: 1 });
    } else {
      setAdultCount(1);
      setChildCount(0);
    }
  };

  const handleAdultChange = (delta: number) => {
    if (!currentSelectedDate) return;
    const newCount = adultCount + delta;
    if (newCount < 0) return;
    const newTotal = newCount + childCount;
    if (newTotal < 1) return;
    if (newTotal > currentSelectedDate.availableSeats) return;
    setAdultCount(newCount);
  };

  const handleChildChange = (delta: number) => {
    if (!currentSelectedDate || !childAgeRange) return;
    const newCount = childCount + delta;
    if (newCount < 0) return;
    const newTotal = adultCount + newCount;
    if (newTotal < 1) return;
    if (newTotal > currentSelectedDate.availableSeats) return;
    setChildCount(newCount);
  };
  const handleActivityParticipantChange = (delta: number) => {
    const newCount = activityParticipantCount + delta;
    if (newCount < 1) return;
    if (currentSelectedDate && newCount > currentSelectedDate.availableSeats)
      return;
    setActivityParticipantCount(newCount);
    onParticipantsChange?.({ total: newCount });
  };

  const totalParticipants = useMemo(() => {
    if (entityType === 'activity') return activityParticipantCount;
    return adultCount + childCount;
  }, [entityType, activityParticipantCount, adultCount, childCount]);

  const checkoutUrl = useMemo(() => {
    if (!currentSelectedDate || !data || totalParticipants <= 0) return null;
    const params = new URLSearchParams({
      type: entityType,
      itemId: data.id,
      dateId: currentSelectedDate.id,
      adults: String(
        entityType === 'activity' ? activityParticipantCount : adultCount,
      ),
      children: String(entityType === 'tour' ? childCount : 0),
      participants:
        entityType === 'activity'
          ? JSON.stringify({ total: activityParticipantCount })
          : JSON.stringify(tourParticipants),
    });
    return `/checkout?${params.toString()}`;
  }, [
    currentSelectedDate,
    data,
    entityType,
    activityParticipantCount,
    tourParticipants,
    totalParticipants,
  ]);

  const canCheckout = Boolean(checkoutUrl);

  const totalPrice = useMemo(() => {
    if (!currentSelectedDate) return 0;
    if (entityType === 'activity') {
      return activityParticipantCount * currentSelectedDate.price;
    }
    return computeTourPricing(
      currentSelectedDate.price,
      selectedDateAgeRanges,
      adultCount,
      childCount,
    ).total;
  }, [
    currentSelectedDate,
    entityType,
    activityParticipantCount,
    selectedDateAgeRanges,
    adultCount,
    childCount,
  ]);

  const renderDatePickerColumn = () => (
    <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex flex-col h-full">
      <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center flex-shrink-0">
        <CalendarIcon className="w-5 h-5 mr-2 text-neutral-950" />
        Tarih Seçin
      </h3>
      <div className="grid grid-cols-1 gap-2.5 overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 scrollbar-thumb-rounded-full flex-grow min-h-0 pr-1">
        {availableDates.length > 0 ? (
          availableDates.map((date) => (
            <button
              key={date.id}
              type="button"
              onClick={() => handleDateSelect(date)}
              className={`flex flex-col p-3 text-left rounded-lg transition-all duration-200 ease-out border focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1 ${currentSelectedDate?.id === date.id ? 'bg-neutral-100 border-neutral-950 shadow-sm' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}
            >
              <span className="text-sm font-medium text-neutral-800">
                {format(new Date(date.startDate), 'd MMMM yyyy', {
                  locale: tr,
                })}
              </span>
              <span className="text-xs text-neutral-600 block mt-0.5">
                {format(new Date(date.startDate), 'eeee', { locale: tr })}
              </span>
              <span className="text-sm font-medium text-neutral-800 mt-1">
                {formatPrice(date.price)} / kişi
              </span>
              {date.availableSeats <= 10 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-2">
                  Son {date.availableSeats} koltuk!
                </span>
              )}
            </button>
          ))
        ) : (
          <p className="text-sm text-neutral-500 text-center py-8">
            Müsait tarih bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );

  const renderActivityParticipantPicker = () => (
    <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex flex-col h-full">
      <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center flex-shrink-0">
        <UserIcon className="w-5 h-5 mr-2 text-emerald-600" />
        Kişi Sayısı
      </h3>
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleActivityParticipantChange(-1)}
            className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={activityParticipantCount <= 1}
          >
            <span className="text-2xl">-</span>
          </button>
          <span className="text-3xl font-bold w-16 text-center text-gray-900">
            {activityParticipantCount}
          </span>
          <button
            onClick={() => handleActivityParticipantChange(1)}
            className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50"
            disabled={
              !!currentSelectedDate &&
              activityParticipantCount >= currentSelectedDate.availableSeats
            }
          >
            <span className="text-2xl">+</span>
          </button>
        </div>
      </div>
      <div className="mt-4 border-t border-neutral-200 pt-3">
        <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center">
          <InformationCircleIcon className="w-4 h-4 mr-2 text-neutral-950" />
          Aktivite Kuralı
        </h4>
        <div className="flex items-start text-sm text-neutral-600">
          <p>
            {activity?.ageRestriction
              ? `Yaş koşulu: ${activity.ageRestriction}. Tüm katılımcıların bu koşulu sağlaması gerekir.`
              : 'Bu aktivite için yaş sınırı belirtilmemiştir.'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderParticipantCounter = (
    label: string,
    count: number,
    onDecrease: () => void,
    onIncrease: () => void,
    decreaseDisabled: boolean,
    increaseDisabled: boolean,
    hint?: string,
  ) => (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">-</span>
        </button>
        <span className="text-3xl font-bold w-16 text-center text-gray-900">
          {count}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:text-neutral-800 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>
    </div>
  );

  const renderTourParticipantPicker = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-950"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex flex-col justify-center items-center h-full text-center">
          <ExclamationCircleIcon className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-sm font-semibold text-neutral-700">
            Bir Hata Oluştu
          </p>
          <p className="text-xs text-neutral-500">{error}</p>
        </div>
      );
    }

    if (selectedDateAgeRanges.length === 0) {
      return (
        <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex flex-col justify-center items-center h-full text-center">
          <InformationCircleIcon className="w-10 h-10 text-neutral-700 mb-2" />
          <p className="text-sm font-semibold text-neutral-700">
            Katılımcı Bilgisi Yok
          </p>
          <p className="text-xs text-neutral-500">
            Bu tarih için özel yaş aralığı veya katılımcı türü bulunmamaktadır.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-4 border border-neutral-200/70 flex flex-col h-full">
        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center flex-shrink-0">
          <UserIcon className="w-5 h-5 mr-2 text-emerald-600" />
          Katılımcılar
        </h3>
        <div className="flex-grow flex flex-col justify-center gap-6">
          {renderParticipantCounter(
            'Yetişkin',
            adultCount,
            () => handleAdultChange(-1),
            () => handleAdultChange(1),
            adultCount <= 0 || (adultCount <= 1 && childCount === 0),
            !currentSelectedDate ||
              totalParticipants >= currentSelectedDate.availableSeats,
            adultAgeRange
              ? childSharesAdultRangeFlag
                ? '18+ yaş'
                : adultAgeRange.maxAge
                  ? `${adultAgeRange.minAge}-${adultAgeRange.maxAge} yaş`
                  : `${adultAgeRange.minAge}+ yaş`
              : undefined,
          )}
          {childAgeRange &&
            renderParticipantCounter(
              'Çocuk',
              childCount,
              () => handleChildChange(-1),
              () => handleChildChange(1),
              childCount <= 0 || (childCount <= 1 && adultCount === 0),
              !currentSelectedDate ||
                totalParticipants >= currentSelectedDate.availableSeats,
              childSharesAdultRangeFlag
                ? '18 yaş altı'
                : childAgeRange.maxAge
                  ? `${childAgeRange.minAge}-${childAgeRange.maxAge} yaş`
                  : `${childAgeRange.minAge}+ yaş`,
            )}
        </div>
      </div>
    );
  };

  const renderAdvantagesColumn = () => (
    <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-200/50 flex flex-col h-full">
      <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center flex-shrink-0">
        <CheckCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
        Avantajlarınız
      </h3>
      <ul className="space-y-2.5 flex-grow content-start">
        {[
          'Ücretsiz iptal imkanı',
          'Anında onay',
          'Özel rehber eşliğinde',
          '7/24 müşteri desteği',
        ].map((item, index) => (
          <li key={index} className="flex items-start text-sm text-neutral-700">
            <CheckCircleIcon className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (!visible && !forceVisible) return null;

  const collapsedUnitPrice = currentSelectedDate?.price ?? data?.price ?? 0;
  const collapsedPriceLabel = currentSelectedDate
    ? formatPrice(totalPrice > 0 ? totalPrice : collapsedUnitPrice)
    : formatPrice(collapsedUnitPrice);

  if (!portalReady) return null;

  // Portaled: callers often render this inside sticky / transformed sidebars,
  // whose stacking context would let later page content paint over the panel.
  return createPortal(
    <>
      {/* Desktop: compact tab to open full panel */}
      {!mobileOnly ? (
        <button
          type="button"
          onClick={handleExpandClick}
          className={`fixed bottom-0 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-2 rounded-t-lg border border-b-0 border-neutral-200/80 bg-white px-5 py-2.5 text-neutral-700 shadow-md transition-all duration-300 ease-out hover:bg-neutral-50 hover:shadow-lg md:flex ${visible && !expanded ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}
        >
          <span className="text-sm font-semibold">
            Tarih ve Fiyat Seçenekleri
          </span>
          <ChevronUpIcon
            className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      ) : null}

      {/* Mobile: sticky price + CTA action bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/80 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden ${visible && !expanded ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'} pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {currentSelectedDate
                ? totalParticipants > 0
                  ? 'Toplam'
                  : 'Kişi başı'
                : 'Başlayan fiyat'}
            </p>
            <p
              className="truncate text-xl font-bold text-neutral-950"
              aria-readonly="true"
            >
              {collapsedPriceLabel}
            </p>
          </div>
          {canCheckout && checkoutUrl ? (
            <Link
              href={checkoutUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-[0.97]"
            >
              Rezervasyon Yap
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleExpandClick}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-[0.97]"
            >
              Rezervasyon Yap
              <ChevronUpIcon className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded ? (
        <div
          className={`fixed inset-0 z-[100] bg-black/50 ${mobileOnly ? 'md:hidden' : 'md:bg-black/30'}`}
          onClick={handleExpandClick}
          aria-hidden="true"
        />
      ) : null}

      <div
        id="booking-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-panel-title"
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-x-0 bottom-0 top-12 z-[101] flex min-h-0 flex-col rounded-t-2xl border-t border-neutral-200/80 bg-white shadow-lg backdrop-blur-sm transition-transform duration-500 ease-out ${mobileOnly ? '' : 'md:inset-x-0 md:bottom-0 md:top-auto md:rounded-none md:bg-white'} ${visible && expanded ? 'translate-y-0' : 'pointer-events-none translate-y-full'} ${mobileOnly ? 'md:hidden' : ''}`}
        style={{ maxHeight: 'calc(100dvh - 3rem)' }}
        aria-hidden={!(visible && expanded)}
      >
        <div className="container mx-auto px-4 py-4 md:py-6 h-full flex flex-col min-h-0 max-h-[calc(100dvh-3rem)] md:max-h-[85vh]">
          <div className="flex items-center justify-between flex-shrink-0 pt-2 md:pt-0 pb-3 md:pb-0 md:relative">
            <h2
              id="booking-panel-title"
              className="text-lg font-semibold text-neutral-800 md:sr-only"
            >
              Tarih ve Fiyat Seçenekleri
            </h2>
            <button
              type="button"
              onClick={handleExpandClick}
              aria-label="Kapat"
              className="ml-auto p-2.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full z-20 relative"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div
            className={`grid grid-cols-1 ${entityType === 'tour' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5 flex-grow overflow-y-auto overscroll-contain touch-pan-y min-h-0 mb-4 md:overflow-hidden md:min-h-[300px]`}
          >
            {renderDatePickerColumn()}
            {entityType === 'tour'
              ? renderTourParticipantPicker()
              : renderActivityParticipantPicker()}
            {/* Activity partners don't publish cancellation / confirmation policies yet. */}
            {entityType === 'tour' ? renderAdvantagesColumn() : null}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-3 border-t border-neutral-200/80 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
            <div className="flex-1 pr-4 text-center sm:text-left">
              <span className="text-2xl font-bold text-neutral-800">
                {formatPrice(totalPrice)}
              </span>
              <span className="text-neutral-500 text-sm ml-2">
                toplam fiyat
              </span>
            </div>
            <div className="flex gap-3 items-center flex-shrink-0">
              <p className="text-sm text-neutral-600 font-medium hidden md:block">
                {currentSelectedDate
                  ? format(
                      new Date(currentSelectedDate.startDate),
                      'd MMMM yyyy',
                      { locale: tr },
                    )
                  : 'Tarih seçilmedi'}
              </p>
              {canCheckout && checkoutUrl ? (
                <Link
                  href={checkoutUrl}
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 hover:shadow-md active:scale-[0.97]"
                >
                  <span>Rezervasyon Yap</span>
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-neutral-950/50 px-6 py-2.5 text-sm font-semibold text-white"
                  aria-disabled="true"
                >
                  <span>Rezervasyon Yap</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
