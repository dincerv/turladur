import { apiRequest } from './api-client';
import type { AvailabilityDay } from './availability';

export type AgencyGuideCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  identityNumber: string;
  city: string | null;
  languages: string[];
  oda: string | null;
  sicilNo: string | null;
  ruhsatNo: string | null;
  ruhsatExpiresAt: string | null;
  birthDate: string | null;
  averageRating: string | null;
  reviewCount: number;
  photoUrl: string | null;
  isAvailableForRange: boolean;
  unavailableDayCount: number;
  isRuhsatExpired: boolean;
};

export type TourDateAssignmentRow = {
  id: string;
  tourDateId: string;
  role: string;
  guideId: string | null;
  busCompanyId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  note: string | null;
  respondedAt: string | null;
  createdAt: string;
  guide?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    city: string | null;
  } | null;
  busCompany?: {
    id: string;
    companyName: string;
    contactEmail: string;
  } | null;
  tourDate?: {
    id: string;
    startDate: string;
    endDate: string;
    vehicleId?: string | null;
    tour: { id: string; title: string };
    vehicle?: {
      id: string;
      plateNumber: string;
      seatLayoutKind: string;
      capacity: number;
    } | null;
  };
};

export async function listAgencyGuides(
  token: string,
  params: {
    from: string;
    to: string;
    q?: string;
    availableOnly?: boolean;
  },
) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.availableOnly) query.set('availableOnly', 'true');

  return apiRequest<AgencyGuideCandidate[]>(
    `/identity/guides?${query.toString()}`,
    { token },
  );
}

export async function getAgencyGuideAvailability(
  token: string,
  guideId: string,
  from: string,
  to: string,
) {
  return apiRequest<AvailabilityDay[]>(
    `/identity/guides/${encodeURIComponent(guideId)}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { token },
  );
}

export async function listTourDateAssignments(
  token: string,
  tourDateId: string,
) {
  return apiRequest<TourDateAssignmentRow[]>(
    `/catalog/tour-dates/${encodeURIComponent(tourDateId)}/assignments`,
    { token },
  );
}

export async function inviteGuideToTourDate(
  token: string,
  tourDateId: string,
  input: { guideId: string; note?: string },
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/tour-dates/${encodeURIComponent(tourDateId)}/assignments/guide`,
    { method: 'POST', body: input, token },
  );
}

export async function inviteBusToTourDate(
  token: string,
  tourDateId: string,
  input: { busCompanyId: string; note?: string },
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/tour-dates/${encodeURIComponent(tourDateId)}/assignments/bus`,
    { method: 'POST', body: input, token },
  );
}

export async function withdrawTourDateAssignment(
  token: string,
  assignmentId: string,
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/assignments/${encodeURIComponent(assignmentId)}/withdraw`,
    { method: 'PATCH', token },
  );
}

export async function cancelTourDateAssignment(
  token: string,
  assignmentId: string,
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/assignments/${encodeURIComponent(assignmentId)}/cancel`,
    { method: 'PATCH', token },
  );
}

export async function listAgencyAssignments(token: string) {
  return apiRequest<TourDateAssignmentRow[]>(
    '/catalog/agencies/me/assignments',
    { token },
  );
}

export async function listGuideAssignments(token: string) {
  return apiRequest<TourDateAssignmentRow[]>('/catalog/guides/me/assignments', {
    token,
  });
}

export async function listBusAssignments(token: string) {
  return apiRequest<TourDateAssignmentRow[]>(
    '/catalog/bus-companies/me/assignments',
    { token },
  );
}

export async function respondGuideAssignment(
  token: string,
  assignmentId: string,
  status: 'ACCEPTED' | 'REJECTED',
  note?: string,
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/assignments/${encodeURIComponent(assignmentId)}/respond`,
    {
      method: 'PATCH',
      body: { status, note },
      token,
    },
  );
}

export async function respondBusAssignment(
  token: string,
  assignmentId: string,
  input: {
    status: 'ACCEPTED' | 'REJECTED';
    vehicleId?: string;
    note?: string;
  },
) {
  return apiRequest<TourDateAssignmentRow>(
    `/catalog/assignments/${encodeURIComponent(assignmentId)}/respond`,
    {
      method: 'PATCH',
      body: input,
      token,
    },
  );
}
