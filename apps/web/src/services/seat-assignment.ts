import { apiRequest } from './api-client';
import type { BusLayoutKindValue } from '@/lib/bus-layout-kinds';

export enum SeatUiStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RESERVED = 'RESERVED',
  LOCKED = 'LOCKED',
  CREW = 'CREW',
  AISLE = 'AISLE',
  DOOR = 'DOOR',
  BLOCKED = 'BLOCKED',
}

export enum SeatGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export type SeatCellType =
  'SEAT' | 'CREW' | 'AISLE' | 'WC' | 'BLOCKED' | 'DOOR' | string;

export type SeatOccupancy = {
  assignmentId: string;
  guestId: string;
  fullName: string;
  bookingNumber: string;
  source: string;
  gender: SeatGender;
};

export type SeatMapCell = {
  code: string;
  row: number;
  col: number;
  type: SeatCellType;
  sellable: boolean;
  status: SeatUiStatus;
  gender: SeatGender | null;
  occupancy: SeatOccupancy | null;
};

export type UnassignedGuest = {
  id: string;
  fullName: string;
  reservationId: string;
  bookingNumber: string;
  identityNumber?: string | null;
  gender: SeatGender;
};

export type SeatMapData = {
  tourDateId: string;
  tourId: string;
  layoutVersion: number;
  layout: {
    id: string;
    kind: string;
    passengerSeats: number;
    orientation: string;
    legend: string[];
    cells: SeatMapCell[];
  };
  assignments: Array<{
    id: string;
    seatCode: string;
    source: string;
    guestId: string;
    fullName: string;
    bookingNumber: string;
    gender: SeatGender;
  }>;
  unassignedGuests: UnassignedGuest[];
};

export async function getTourDateSeatMap(
  tourDateId: string,
  token: string,
  tourId?: string,
) {
  const qs = tourId ? `?tourId=${encodeURIComponent(tourId)}` : '';
  return apiRequest<SeatMapData>(
    `/booking/tour-dates/${tourDateId}/seats${qs}`,
    { token },
  );
}

export async function assignSeatManual(
  tourDateId: string,
  body: { seatCode: string; reservationGuestId: string; tourId?: string },
  token: string,
) {
  return apiRequest(`/booking/tour-dates/${tourDateId}/seats/assign`, {
    method: 'POST',
    body,
    token,
  });
}

export async function assignSeatsBulk(
  tourDateId: string,
  body: {
    assignments: Array<{ seatCode: string; reservationGuestId: string }>;
    tourId?: string;
  },
  token: string,
) {
  return apiRequest(`/booking/tour-dates/${tourDateId}/seats/assign-bulk`, {
    method: 'POST',
    body,
    token,
  });
}

export async function autoFifoSeats(
  tourDateId: string,
  token: string,
  tourId?: string,
) {
  return apiRequest(`/booking/tour-dates/${tourDateId}/seats/auto-fifo`, {
    method: 'POST',
    body: tourId ? { tourId } : {},
    token,
  });
}

export async function unassignSeat(assignmentId: string, token: string) {
  return apiRequest(`/booking/seat-assignments/${assignmentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function setTourDateBusLayout(
  tourDateId: string,
  kind: BusLayoutKindValue,
  token: string,
) {
  return apiRequest(`/catalog/tour-dates/${tourDateId}/bus-seat-layout`, {
    method: 'PUT',
    body: { kind },
    token,
  });
}
