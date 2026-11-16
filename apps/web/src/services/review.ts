import { apiRequest, apiRequestWithMeta } from './api-client';
import type {
  Review,
  TourPersonaMatchResponse,
  TravelerPersona,
} from '@turta/shared-types';

export async function listTourReviews(
  tourId: string,
  params?: { minRating?: number; page?: number },
) {
  const qs = new URLSearchParams();
  if (params?.minRating) qs.set('minRating', String(params.minRating));
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return apiRequestWithMeta<Review[]>(
    `/review/tours/${tourId}${q ? `?${q}` : ''}`,
  );
}

export async function matchTourPersona(
  tourId: string,
  body: { persona: TravelerPersona; intent?: string },
) {
  return apiRequest<TourPersonaMatchResponse>(
    `/review/tours/${tourId}/persona-match`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function getReviewEligibility(tourId: string, token: string) {
  return apiRequest<{
    reservationId: string;
    alreadyReviewed: boolean;
  } | null>(`/review/eligible/${tourId}`, { token });
}

export async function createReview(
  body: {
    reservationId: string;
    rating: number;
    comment?: string;
  },
  token: string,
) {
  return apiRequest<Review>('/review', { method: 'POST', body, token });
}

export async function listMyReviews(token: string) {
  return apiRequest<Review[]>('/review/me', { token });
}
