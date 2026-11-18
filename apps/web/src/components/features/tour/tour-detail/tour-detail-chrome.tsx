'use client';

import BottomBookingBar from '@/components/booking/bottom-booking-bar';
import { useTourDetailUi } from './tour-detail-context';

/**
 * Booking chrome for kişi seçimi + rezervasyon.
 * Sidebar lists dates; this sheet opens after a date is chosen (all breakpoints).
 */
export function TourDetailChrome() {
  const {
    tour,
    availableTourDates,
    selectedTourDate,
    expanded,
    setExpanded,
    handleDateSelect,
    handleParticipantsChange,
  } = useTourDetailUi();

  return (
    <BottomBookingBar
      tour={tour ? { ...tour, tourDates: availableTourDates } : undefined}
      onDateSelect={handleDateSelect}
      onParticipantsChange={handleParticipantsChange}
      isExpanded={expanded}
      onExpandedChange={setExpanded}
      selectedDate={selectedTourDate}
      forceVisible={Boolean(selectedTourDate)}
    />
  );
}
