'use client';

import BottomBookingBar from '@/components/booking/bottom-booking-bar';
import { useTourDetailUi } from './tour-detail-context';

/** Mobile booking chrome; desktop uses sticky sidebar. */
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
      mobileOnly
    />
  );
}
