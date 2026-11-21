'use client';

import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { ActivityDate as BookingActivityDate } from '@/components/booking/bottom-booking-bar';
import type { OperatorReview } from '@/components/features/tour-operator/OperatorReviewsSection';
import type {
  ItineraryItem,
  Tour,
  TourDate,
  TourOperator,
  TourRouteStopView,
} from './tour-detail.types';

export type TourDetailUiContextValue = {
  tour: Tour;
  tourOperator: TourOperator | null;
  otherTours: Tour[];
  availableTourDates: TourDate[];
  selectedTourDate: TourDate | null;
  showDateSelectionHint: boolean;
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  showScrollIndicator: boolean;
  inclusions: string[];
  exclusions: string[];
  healthPrivileges: string[];
  destinations: string[];
  galleryImages: string[];
  galleryLightboxIndex: number | null;
  openGalleryAt: (indexOrUrl: number | string) => void;
  closeGallery: () => void;
  setGalleryLightboxIndex: Dispatch<SetStateAction<number | null>>;
  activePickupPoints: NonNullable<Tour['pickupPoints']>;
  routeStops: TourRouteStopView[];
  pickupSlideCount: number;
  pickupSlideClass: string;
  pickupSliderRef: RefObject<HTMLDivElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  scrollPickupSlider: (direction: 'prev' | 'next') => void;
  itinerary: Record<string, ItineraryItem>;
  tourReviews: OperatorReview[];
  tourReviewCount: number;
  tourAverageRating: number;
  displayRating: number;
  displayReviewCount: number;
  nights: number;
  promptDateSelection: () => void;
  handleDateSelect: (date: TourDate | BookingActivityDate | null) => void;
  handleParticipantsChange: (participants: { [key: string]: number }) => void;
};

const TourDetailUiContext = createContext<TourDetailUiContextValue | null>(
  null,
);

export function TourDetailUiProvider({
  value,
  children,
}: {
  value: TourDetailUiContextValue;
  children: ReactNode;
}) {
  return (
    <TourDetailUiContext.Provider value={value}>
      {children}
    </TourDetailUiContext.Provider>
  );
}

export function useTourDetailUi(): TourDetailUiContextValue {
  const ctx = useContext(TourDetailUiContext);
  if (!ctx) {
    throw new Error('useTourDetailUi must be used within TourDetailUiProvider');
  }
  return ctx;
}
